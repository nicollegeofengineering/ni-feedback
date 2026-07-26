const express = require("express");
const router = express.Router();

const Timetable = require("../models/Timetable");
require("../models/Subjects");
require("../models/Staff");

// GET /api/subjects?department=CSE&year=2&semester=3
router.get("/", async (req, res) => {
  try {
    const { department, year, semester } = req.query;

    if (!department || !year || !semester) {
      return res.status(400).json({
        message: "department, year, and semester are required",
      });
    }

    const result = await Timetable.aggregate([
      {
        $match: {
          department,
          year: Number(year),
          semester: Number(semester),
        },
      },

      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },

      {
        $lookup: {
          from: "staffs",
          localField: "staff",
          foreignField: "_id",
          as: "staffInfo",
        },
      },

      {
        $unwind: "$subjectInfo",
      },

      {
        $unwind: "$staffInfo",
      },

      {
        $group: {
          _id: {
            subject: "$subject",
            staff: "$staff",
          },

          department: {
            $first: "$department",
          },

          year: {
            $first: "$year",
          },

          semester: {
            $first: "$semester",
          },

          subjectCode: {
            $first: "$subjectInfo.subjectCode",
          },

          subjectName: {
            $first: "$subjectInfo.subjectName",
          },

          facultyName: {
            $first: "$staffInfo.staffName",
          },
        },
      },

      {
        $project: {
          _id: 0,
          subjectId: "$_id.subject",
          staffId: "$_id.staff",
          department: 1,
          year: 1,
          semester: 1,
          subjectCode: 1,
          subjectName: 1,
          facultyName: 1,
        },
      },

      {
        $sort: {
          subjectCode: 1,
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Subject fetch error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

/*
 * Subjects are managed by the NICETECH Timetable System.
 * These endpoints are intentionally disabled.
 */

router.post("/", (req, res) => {
  res.status(403).json({
    message: "Subjects are managed by the NICETECH Timetable System.",
  });
});

router.put("/:id", (req, res) => {
  res.status(403).json({
    message: "Subjects are managed by the NICETECH Timetable System.",
  });
});

router.delete("/:id", (req, res) => {
  res.status(403).json({
    message: "Subjects are managed by the NICETECH Timetable System.",
  });
});

module.exports = router;