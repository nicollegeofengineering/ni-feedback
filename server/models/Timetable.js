const mongoose = require("mongoose");
const { nicetechDB } = require("../db");


const timetableSchema = new mongoose.Schema(
  {
    academicYear: String,
    department: String,
    year: Number,
    semester: Number,
    day: Number,
    period: Number,

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },

    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },

    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
    },
  },
  {
    collection: "timetables", // change if your actual collection name differs
    timestamps: true,
  }
);

module.exports =nicetechDB.model("Timetable", timetableSchema);