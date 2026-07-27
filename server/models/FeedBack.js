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
    subjectKnowledge: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    clarityOfExplanation: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    willingnessToHelp: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    classRegularity: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    clarityBeyondNotes: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    lectureOrganization: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    presentationSpeed: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    encouragesQuestions: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    teacherBehaviour: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    blackboardUsage: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    teacherSincerity: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    fairnessOfEvaluation: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    promptnessOfEvaluation: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    overallTeachingEffectiveness: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
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

// Prevent duplicate feedback for the same student, subject, faculty, year and semester
feedbackSchema.index(
  {
    studentRegno: 1,
    subjectCode: 1,
    facultyName: 1,
    year: 1,
    semester: 1
  },
  { unique: true }
);

// Performance indexes
feedbackSchema.index({ subjectCode: 1, submittedAt: -1 });
feedbackSchema.index({ department: 1, year: 1, semester: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);