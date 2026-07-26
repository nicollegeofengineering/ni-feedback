const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const Feedback = require('../models/FeedBack');
const Student = require('../models/Student');
const Timetable = require('../models/Timetable');
require('../models/Subjects');
require('../models/Staff');
const sendOtp = require('../utils/sendOtp');
const auth = require('../middleware/auth');

// ------------------------------------------------------------
// 0. Constants – all 20 question keys
// ------------------------------------------------------------
const QUESTION_KEYS = [
  'regularClassAttendance',
  'classPunctuality',
  'teachingSincerity',
  'subjectKnowledge',
  'conceptExplanation',
  'teachingMethod',
  'teachingAidsUsage',
  'practicalExamples',
  'studentParticipation',
  'doubtClarification',
  'syllabusCompletion',
  'classTestsConduct',
  'testPaperEvaluation',
  'assignmentsEffectiveness',
  'classroomDiscipline',
  'professionalBehaviour',
  'studentApproachability',
  'studyMaterials',
  'revisionBeforeExams',
  'classPreparation'
];

// Helper: build $group stage for averages
function buildAvgGroup(prefix = '') {
  const group = { _id: null };
  QUESTION_KEYS.forEach(key => {
    group[`avg${prefix}${capitalize(key)}`] = { $avg: `$ratings.${key}` };
  });
  return group;
}

// Helper: build $project stage for overall average
function buildOverallAvgProject(prefix = '') {
  const fields = {};
  QUESTION_KEYS.forEach(key => {
    const field = `avg${prefix}${capitalize(key)}`;
    fields[field] = 1;
  });
  fields.overallAvg = { $avg: QUESTION_KEYS.map(k => `$avg${prefix}${capitalize(k)}`) };
  return fields;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}



router.get('/dashboard', auth, async (req, res) => {
  try {
    if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
    const { department, semester, year } = req.query;
    const match = {};
    if (department) match.department = department;
    if (semester) match.semester = parseInt(semester);
    if (year) match.year = parseInt(year);

    const basePipeline = Object.keys(match).length ? [{ $match: match }] : [];

    // Total Responses
    const totalResponses = await Feedback.countDocuments(match);

    // Overall Average per question (global)
    const avgGroup = buildAvgGroup('');
    const overallAvgResult = await Feedback.aggregate([
      ...basePipeline,
      { $group: avgGroup },
      { $project: { _id: 0 } }
    ]);

    let overallAvg = 0;
    if (overallAvgResult.length > 0) {
      const values = Object.values(overallAvgResult[0]);
      overallAvg = values.reduce((a, b) => a + b, 0) / values.length;
    }

    // Subject Wise Report
    const subjectGroup = {
      _id: {
        subjectCode: '$subjectCode',
        subjectName: '$subjectName',
        faculty: '$facultyName'
      },
      responses: { $sum: 1 }
    };
    QUESTION_KEYS.forEach(key => {
      subjectGroup[`avg${capitalize(key)}`] = { $avg: `$ratings.${key}` };
    });

    const subjectWise = await Feedback.aggregate([
      ...basePipeline,
      { $group: subjectGroup },
      {
        $project: {
          _id: 0,
          subjectCode: '$_id.subjectCode',
          subjectName: '$_id.subjectName',
          facultyName: '$_id.faculty',
          responses: 1,
          ...QUESTION_KEYS.reduce((acc, key) => {
            acc[`avg${capitalize(key)}`] = 1;
            return acc;
          }, {}),
          overallAvg: {
            $avg: QUESTION_KEYS.map(k => `$avg${capitalize(k)}`)
          }
        }
      },
      { $sort: { overallAvg: -1 } }
    ]);

    // Faculty Wise Report
    const facultyGroup = {
      _id: '$facultyName',
      subjects: { $addToSet: '$subjectName' },
      responses: { $sum: 1 }
    };
    QUESTION_KEYS.forEach(key => {
      facultyGroup[`avg${capitalize(key)}`] = { $avg: `$ratings.${key}` };
    });

    const facultyWise = await Feedback.aggregate([
      ...basePipeline,
      { $group: facultyGroup },
      {
        $project: {
          _id: 0,
          facultyName: '$_id',
          subjects: 1,
          responses: 1,
          ...QUESTION_KEYS.reduce((acc, key) => {
            acc[`avg${capitalize(key)}`] = 1;
            return acc;
          }, {}),
          overallAvg: {
            $avg: QUESTION_KEYS.map(k => `$avg${capitalize(k)}`)
          }
        }
      },
      { $sort: { overallAvg: -1 } }
    ]);

    // Highest Rated Subject & Faculty
    const highestSubject = subjectWise.length ? {
      subjectName: subjectWise[0].subjectName,
      avgRating: subjectWise[0].overallAvg.toFixed(2)
    } : null;

    const highestFaculty = facultyWise.length ? {
      facultyName: facultyWise[0].facultyName,
      avgRating: facultyWise[0].overallAvg.toFixed(2)
    } : null;

    // Question Wise Report (global averages)
    const questionWiseGroup = { _id: null };
    QUESTION_KEYS.forEach(key => {
      questionWiseGroup[key] = { $avg: `$ratings.${key}` };
    });
    const questionWiseResult = await Feedback.aggregate([
      ...basePipeline,
      { $group: questionWiseGroup },
      { $project: { _id: 0 } }
    ]);
    const questionWise = questionWiseResult[0] || {};

    // Grade Distribution: based on overall average per feedback
    const gradeDistResult = await Feedback.aggregate([
      ...basePipeline,
      {
        $addFields: {
          overallRating: {
            $avg: QUESTION_KEYS.map(key => `$ratings.${key}`)
          }
        }
      },
      {
        $group: {
          _id: null,
          excellent: { $sum: { $cond: [{ $gte: ['$overallRating', 4.5] }, 1, 0] } },
          veryGood: { $sum: { $cond: [{ $and: [{ $gte: ['$overallRating', 4.0] }, { $lt: ['$overallRating', 4.5] }] }, 1, 0] } },
          good: { $sum: { $cond: [{ $and: [{ $gte: ['$overallRating', 3.5] }, { $lt: ['$overallRating', 4.0] }] }, 1, 0] } },
          average: { $sum: { $cond: [{ $and: [{ $gte: ['$overallRating', 3.0] }, { $lt: ['$overallRating', 3.5] }] }, 1, 0] } },
          needsImprovement: { $sum: { $cond: [{ $lt: ['$overallRating', 3.0] }, 1, 0] } }
        }
      },
      { $project: { _id: 0 } }
    ]);
    const gradeDistribution = gradeDistResult[0] || {
      excellent: 0, veryGood: 0, good: 0, average: 0, needsImprovement: 0
    };

    res.json({
      totalResponses,
      overallAverageRating: overallAvg.toFixed(2),
      highestSubject,
      highestFaculty,
      subjectWise,
      facultyWise,
      questionWise,
      gradeDistribution
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// 3. Subject List (unchanged)
// ------------------------------------------------------------
router.get('/subjects', auth, async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const { department, year, semester } = req.query;

    const match = {};
    if (department) match.department = department;
    if (year) match.year = Number(year);
    if (semester) match.semester = Number(semester);

    const result = await Timetable.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subjectInfo"
        }
      },
      {
        $lookup: {
          from: "staffs",
          localField: "staff",
          foreignField: "_id",
          as: "staffInfo"
        }
      },
      { $unwind: "$subjectInfo" },
      { $unwind: "$staffInfo" },
      {
        $group: {
          _id: {
            department: "$department",
            year: "$year",
            semester: "$semester",
            subject: "$subject",
            staff: "$staff"
          },
          department: { $first: "$department" },
          year: { $first: "$year" },
          semester: { $first: "$semester" },
          subjectCode: { $first: "$subjectInfo.subjectCode" },
          subjectName: { $first: "$subjectInfo.subjectName" },
          facultyName: { $first: "$staffInfo.staffName" }
        }
      },
      {
        $project: {
          _id: 0,
          department: 1,
          year: 1,
          semester: 1,
          subjectCode: 1,
          subjectName: 1,
          facultyName: 1
        }
      },
      { $sort: { department: 1, year: 1, semester: 1, subjectCode: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error("Subjects fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------------------------------------------
// 4. Subject Detailed Report (updated with new keys)
// ------------------------------------------------------------
router.get('/subject-details', auth, async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const { subjectCode } = req.query;
    if (!subjectCode) return res.status(400).json({ message: 'Subject code is required' });

    // Build dynamic $group for averages
    const groupStage = { _id: null };
    QUESTION_KEYS.forEach(key => {
      groupStage[key] = { $avg: `$ratings.${key}` };
    });

    const questionAvgs = await Feedback.aggregate([
      { $match: { subjectCode } },
      { $group: groupStage },
      { $project: { _id: 0 } }
    ]);

    const comments = await Feedback.find({ subjectCode, comment: { $ne: '' } })
      .select('comment createdAt')
      .sort({ createdAt: -1 });

    res.json({
      subjectCode,
      averages: questionAvgs[0] || {},
      comments
    });
  } catch (err) {
    console.error('Subject details error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// 5. Student Management (unchanged)
// ------------------------------------------------------------
router.get('/students', auth, async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const { year, department, submitted } = req.query;

    const studentFilter = {};
    if (year) studentFilter.year = parseInt(year);
    if (department) studentFilter.department = department;

    const students = await Student.find(studentFilter)
      .select('regno email department year semester status isVerified')
      .sort({ regno: 1 });

    const studentsWithStatus = await Promise.all(
      students.map(async (student) => {
        const feedbackCount = await Feedback.countDocuments({
          studentRegno: student.regno
        });

        return {
          regno: student.regno,
          email: student.email,
          department: student.department,
          year: student.year,
          semester: student.semester,
          status:student.status,
          isVerified: student.isVerified,
          hasSubmitted: feedbackCount > 0,
          feedbackCount: feedbackCount
        };
      })
    );

    let filteredStudents = studentsWithStatus;
    if (submitted === 'true') {
      filteredStudents = studentsWithStatus.filter(s => s.hasSubmitted);
    } else if (submitted === 'false') {
      filteredStudents = studentsWithStatus.filter(s => !s.hasSubmitted);
    }

    res.json(filteredStudents);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/students/:regno/feedback', auth, async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const { regno } = req.params;

    const student = await Student.findOne({ regno });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const feedbacks = await Feedback.find({ studentRegno: regno })
      .sort({ submittedAt: -1 });

    if (feedbacks.length === 0) {
      return res.json({
        student: {
          regno: student.regno,
          email: student.email,
          department: student.department,
          year: student.year,
          status:student.status,
          semester: student.semester
        },
        feedbacks: [],
        message: 'No feedback submitted yet'
      });
    }

    // Compute average ratings per question across all feedbacks
    const avgRatings = {};
    QUESTION_KEYS.forEach(key => {
      avgRatings[key] = 0;
    });

    feedbacks.forEach(fb => {
      QUESTION_KEYS.forEach(key => {
        avgRatings[key] += fb.ratings[key] || 0;
      });
    });

    QUESTION_KEYS.forEach(key => {
      avgRatings[key] = parseFloat((avgRatings[key] / feedbacks.length).toFixed(2));
    });

    // Overall average across all questions
    const overallAvg = parseFloat(
      (Object.values(avgRatings).reduce((a, b) => a + b, 0) / QUESTION_KEYS.length).toFixed(2)
    );

    res.json({
      student: {
        regno: student.regno,
        email: student.email,
        department: student.department,
        year: student.year,
        semester: student.semester
      },
      summary: {
        totalFeedbacks: feedbacks.length,
        averageRatings: avgRatings,
        overallAverage: overallAvg
      },
      feedbacks: feedbacks.map(fb => ({
        subjectCode: fb.subjectCode,
        subjectName: fb.subjectName,
        facultyName: fb.facultyName,
        ratings: fb.ratings,
        comment: fb.comment,
        submittedAt: fb.submittedAt,
        department: fb.department,
        year: fb.year,
        semester: fb.semester
      }))
    });
  } catch (err) {
    console.error('Error fetching student feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/students/statistics', auth, async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const totalStudents = await Student.countDocuments();

    const studentsByYear = await Student.aggregate([
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $project: { _id: 0, year: '$_id', count: 1 } },
      { $sort: { year: 1 } }
    ]);

    const studentsByDepartment = await Student.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $project: { _id: 0, department: '$_id', count: 1 } },
      { $sort: { department: 1 } }
    ]);

    const studentsWithFeedback = await Feedback.aggregate([
      { $group: { _id: '$studentRegno' } },
      { $count: 'total' }
    ]);

    const submittedCount = studentsWithFeedback.length > 0 ? studentsWithFeedback[0].total : 0;

    res.json({
      totalStudents,
      submittedCount,
      notSubmittedCount: totalStudents - submittedCount,
      submissionRate: totalStudents > 0 ? ((submittedCount / totalStudents) * 100).toFixed(1) : 0,
      studentsByYear: studentsByYear.map(item => ({
        year: item.year,
        count: item.count
      })),
      studentsByDepartment: studentsByDepartment.map(item => ({
        department: item.department,
        count: item.count
      }))
    });
  } catch (err) {
    console.error('Error fetching student statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/students/export', auth, async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const { year, department } = req.query;

    const filter = {};
    if (year) filter.year = parseInt(year);
    if (department) filter.department = department;

    const students = await Student.find(filter)
      .select('regno email department year semester isVerified createdAt')
      .sort({ regno: 1 });

    const studentsWithData = await Promise.all(
      students.map(async (student) => {
        const feedbackCount = await Feedback.countDocuments({
          studentRegno: student.regno
        });

        let latestFeedback = null;
        if (feedbackCount > 0) {
          const lastFeedback = await Feedback.findOne({
            studentRegno: student.regno
          }).sort({ submittedAt: -1 });
          latestFeedback = lastFeedback ? lastFeedback.submittedAt : null;
        }

        return {
          regno: student.regno,
          email: student.email,
          department: student.department,
          year: student.year,
          semester: student.semester,
          isVerified: student.isVerified,
          registeredAt: student.createdAt,
          hasSubmitted: feedbackCount > 0,
          feedbackCount: feedbackCount,
          lastFeedbackDate: latestFeedback
        };
      })
    );

    res.json({
      total: studentsWithData.length,
      students: studentsWithData
    });
  } catch (err) {
    console.error('Error exporting students:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------------------------------------------
// 6. Clear All Feedback (unchanged)
// ------------------------------------------------------------
router.delete('/feedback/clear-all', auth, async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const { confirm } = req.body;

    if (confirm !== 'CLEAR ALL RESPONSE') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation text must be "CLEAR ALL RESPONSE"'
      });
    }

    const totalFeedbacks = await Feedback.countDocuments();

    if (totalFeedbacks === 0) {
      return res.status(400).json({
        success: false,
        message: 'No feedback responses to delete'
      });
    }

    const result = await Feedback.deleteMany({});

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} feedback responses`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error clearing feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing feedback'
    });
  }
});

// ------------------------------------------------------------
// 7. Promote All Active Students
// ------------------------------------------------------------
router.put("/students/promote-all", async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
    try {

        // Delete previously passed out students
        const deleted = await Student.deleteMany({
            status: "Passed Out"
        });

        // Final Year -> Passed Out
        const r4 = await Student.updateMany(
            { year: 4, status: "Active" },
            {
                $set: {
                    status: "Passed Out"
                },
                $inc: {
                    year: 1
                }
            }
        );

        // Year 3 -> Year 4
        const r3 = await Student.updateMany(
            { year: 3, status: "Active" },
            {
                $inc: { year: 1 }
            }
        );

        // Year 2 -> Year 3
        const r2 = await Student.updateMany(
            { year: 2, status: "Active" },
            {
                $inc: { year: 1 }
            }
        );

        // Year 1 -> Year 2
        const r1 = await Student.updateMany(
            { year: 1, status: "Active" },
            {
                $inc: { year: 1 }
            }
        );

        res.json({
            success: true,
            message: "Students promoted successfully.",
            promoted:
                r1.modifiedCount +
                r2.modifiedCount +
                r3.modifiedCount +
                r4.modifiedCount,
            deletedPassedOut: deleted.deletedCount
        });

    } catch (err) {
        console.error("Promotion Error:", err);

        res.status(500).json({
            success: false,
            message: "Failed to promote students."
        });
    }
});

// ------------------------------------------------------------
// 8. Reverse Promotion
// ------------------------------------------------------------
router.put('/students/reverse-promotion', async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {

    const down2to1 = await Student.updateMany(
      { year: 2, status: 'Active' },
      { $set: { year: 1 } }
    );

     const down3to2 = await Student.updateMany(
      { year: 3, status: 'Active' },
      { $set: { year: 2 } }
    );
    const down4to3 = await Student.updateMany(
      { year: 4, status: 'Active' },
      { $set: { year: 3 } }
    );
    
    const revertPassed = await Student.updateMany(
      { status: "Passed Out" },
      {
        $set: {
        status: "Active",
        year: 4,
      },
    }
  );

    const totalReverted =
      revertPassed.modifiedCount +
      down4to3.modifiedCount +
      down3to2.modifiedCount +
      down2to1.modifiedCount;

    res.json({
      success: true,
      message: 'Promotion reversed successfully.',
      revertedCount: totalReverted
    });
  } catch (err) {
    console.error('Reverse promotion error:', err);
    res.status(500).json({ success: false, message: 'Server error during reverse promotion' });
  }
});

// ------------------------------------------------------------
// 9. Delete Student (with confirmation & related feedback removal)
// ------------------------------------------------------------
router.delete('/students/:regno', async (req, res) => {
  if(req.user.role!=="Admin"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const { regno } = req.params;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE STUDENT') {
      return res.status(400).json({
        success: false,
        message: 'Type DELETE STUDENT to confirm.'
      });
    }

    const student = await Student.findOne({ regno });
    if (!student) {
      return res.status(200).json({ success: false, message: 'Student not found' });
    }

    // Delete all feedback belonging to that student
    await Feedback.deleteMany({ studentRegno: regno });

    // Delete student record
    await Student.deleteOne({ regno });

    res.json({
      success: true,
      message: 'Student and related feedback deleted successfully.'
    });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ success: false, message: 'Server error while deleting student' });
  }
});

module.exports = router;