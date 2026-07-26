const mongoose = require("mongoose");
const { nicetechDB } = require("../db");


const subjectSchema = new mongoose.Schema(
  {
    subjectName: String,
    subjectCode: String,
    Category: String,
  },
  {
    collection: "subjects",
    timestamps: true,
  }
);

module.exports =nicetechDB.model("Subject", subjectSchema);