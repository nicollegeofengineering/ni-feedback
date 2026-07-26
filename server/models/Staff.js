const mongoose = require("mongoose");
const { nicetechDB } = require("../db");

const staffSchema = new mongoose.Schema(
  {
    staffName: String,
    staffCode: String,
    staffId: String,
    facultyId: String,
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
  },
  {
    collection: "staff",
    timestamps: true,
  }
);

module.exports = nicetechDB.model("Staff", staffSchema);