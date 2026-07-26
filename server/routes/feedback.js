const express = require('express');
const router = express.Router();
const Feedback = require('../models/FeedBack');
const Student = require('../models/Student');
const authMiddleware = require('../middleware/auth');

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

// Helper: build ratings object with default nulls
function createRatingsObject(data) {
  const ratings = {};
  QUESTION_KEYS.forEach(key => {
    ratings[key] = data[key] !== undefined ? data[key] : null;
  });
  return ratings;
}

// POST /api/feedback – Submit feedback (Protected)
router.post('/', authMiddleware, async (req, res) => {
  if(req.user.role!=="Student"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const feedbacks = req.body;
    const studentId = req.user.id;

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Feedback data must be a non-empty array'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Validate and build documents
    const validationErrors = [];
    const feedbackDocs = [];

    for (let i = 0; i < feedbacks.length; i++) {
      const fb = feedbacks[i];

      if (!fb.subjectCode || !fb.subjectName || !fb.facultyName || !fb.ratings) {
        validationErrors.push({
          index: i,
          message: 'Missing required fields: subjectCode, subjectName, facultyName, or ratings'
        });
        continue;
      }

      const missingRatings = QUESTION_KEYS.filter(key => fb.ratings[key] === undefined || fb.ratings[key] === null);
      if (missingRatings.length > 0) {
        validationErrors.push({
          index: i,
          message: `Missing ratings for: ${missingRatings.join(', ')}`
        });
        continue;
      }

      const invalidRatings = QUESTION_KEYS.filter(key => {
        const value = fb.ratings[key];
        return typeof value !== 'number' || value < 1 || value > 5;
      });
      if (invalidRatings.length > 0) {
        validationErrors.push({
          index: i,
          message: `Invalid rating values for: ${invalidRatings.join(', ')}. Ratings must be between 1-5`
        });
        continue;
      }

      // Build ratings object
      const ratingsObj = {};
      QUESTION_KEYS.forEach(key => {
        ratingsObj[key] = fb.ratings[key];
      });

      feedbackDocs.push({
        department: student.department,
        year: student.year,
        semester: student.semester,
        subjectCode: fb.subjectCode,
        subjectName: fb.subjectName,
        facultyName: fb.facultyName,
        studentRegno: student.regno,
        ratings: ratingsObj,
        comment: fb.comment || '',
        submittedAt: new Date()
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors in feedback data',
        errors: validationErrors
      });
    }

    // ========== UPDATED DUPLICATE CHECK ==========
    // Matches the new unique index: { studentRegno, subjectCode, facultyName, year, semester }
    const duplicateEntries = [];
    for (const doc of feedbackDocs) {
      const existing = await Feedback.findOne({
        studentRegno: student.regno,
        subjectCode: doc.subjectCode,
        facultyName: doc.facultyName,
        year: student.year,
        semester: student.semester
      });
      if (existing) {
        duplicateEntries.push(`${doc.subjectCode} (${doc.facultyName})`);
      }
    }

    if (duplicateEntries.length > 0) {
      return res.status(409).json({
        success: false,
        message: `You have already submitted feedback for: ${duplicateEntries.join(', ')}`,
        existingSubjects: duplicateEntries,
      });
    }
    // ========== END DUPLICATE CHECK ==========

    // Insert all feedback documents
    const insertedFeedbacks = await Feedback.insertMany(feedbackDocs);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      count: insertedFeedbacks.length,
      data: insertedFeedbacks.map(fb => ({
        id: fb._id,
        subjectCode: fb.subjectCode,
        subjectName: fb.subjectName,
        submittedAt: fb.submittedAt
      }))
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate feedback submission detected. You have already submitted feedback for one of these subjects.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// GET /api/feedback/check – Check if student has submitted feedback
router.get('/check', authMiddleware, async (req, res) => {
  if(req.user.role!=="Student"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const feedbackExists = await Feedback.exists({ studentRegno: student.regno });
    res.json({
      success: true,
      submitted: !!feedbackExists,
    });
  } catch (error) {
    console.error('Check feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/feedback/my-feedback – Get student's own feedback
router.get('/my-feedback', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const feedbacks = await Feedback.find({ studentRegno: student.regno }).sort({ submittedAt: -1 });
    res.json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/feedback/subject/:subjectCode – Get feedback for a subject (Admin)
router.get('/subject/:subjectCode', authMiddleware, async (req, res) => {
  if(req.user.role!=="Student"){
      return res.status(401).json({message:"Invalid role to access."})
    }
  try {
    const { subjectCode } = req.params;
    const feedbacks = await Feedback.find({ subjectCode }).sort({ submittedAt: -1 });

    if (feedbacks.length === 0) {
      return res.status(404).json({ success: false, message: 'No feedback found for this subject' });
    }

    const avgRatings = {};
    QUESTION_KEYS.forEach(key => { avgRatings[key] = 0; });
    feedbacks.forEach(fb => {
      QUESTION_KEYS.forEach(key => {
        avgRatings[key] += fb.ratings[key] || 0;
      });
    });
    QUESTION_KEYS.forEach(key => {
      avgRatings[key] = parseFloat((avgRatings[key] / feedbacks.length).toFixed(2));
    });

    res.json({
      success: true,
      subjectCode,
      totalResponses: feedbacks.length,
      averageRatings: avgRatings,
      feedbacks,
    });
  } catch (error) {
    console.error('Get subject feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;