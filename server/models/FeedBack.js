const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'AI&DS', 'ECE', 'IT', 'MECH', 'EEE']
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  subjectCode: {
    type: String,
    required: true,
    trim: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  facultyName: {
    type: String,
    required: true,
    trim: true
  },
  studentRegno: {
    type: String,
    required: true,
    index: true
  },
  ratings: {
    regularClassAttendance: { type: Number, required: true, min: 1, max: 5 },
    classPunctuality: { type: Number, required: true, min: 1, max: 5 },
    teachingSincerity: { type: Number, required: true, min: 1, max: 5 },
    subjectKnowledge: { type: Number, required: true, min: 1, max: 5 },
    conceptExplanation: { type: Number, required: true, min: 1, max: 5 },
    teachingMethod: { type: Number, required: true, min: 1, max: 5 },
    teachingAidsUsage: { type: Number, required: true, min: 1, max: 5 },
    practicalExamples: { type: Number, required: true, min: 1, max: 5 },
    studentParticipation: { type: Number, required: true, min: 1, max: 5 },
    doubtClarification: { type: Number, required: true, min: 1, max: 5 },
    syllabusCompletion: { type: Number, required: true, min: 1, max: 5 },
    classTestsConduct: { type: Number, required: true, min: 1, max: 5 },
    testPaperEvaluation: { type: Number, required: true, min: 1, max: 5 },
    assignmentsEffectiveness: { type: Number, required: true, min: 1, max: 5 },
    classroomDiscipline: { type: Number, required: true, min: 1, max: 5 },
    professionalBehaviour: { type: Number, required: true, min: 1, max: 5 },
    studentApproachability: { type: Number, required: true, min: 1, max: 5 },
    studyMaterials: { type: Number, required: true, min: 1, max: 5 },
    revisionBeforeExams: { type: Number, required: true, min: 1, max: 5 },
    classPreparation: { type: Number, required: true, min: 1, max: 5 }
  },
  comment: {
    type: String,
    default: '',
    maxlength: 500
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// ---------- CORRECT UNIQUE INDEX ----------
// Prevents duplicate feedback for the same student → subject → faculty in the same semester
feedbackSchema.index(
  { studentRegno: 1, subjectCode: 1, facultyName: 1, year: 1, semester: 1 },
  { unique: true }
);

// Other indexes for performance
feedbackSchema.index({ subjectCode: 1, submittedAt: -1 });
feedbackSchema.index({ department: 1, year: 1, semester: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);