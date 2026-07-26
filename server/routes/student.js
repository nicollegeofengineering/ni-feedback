const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Student = require('../models/Student');

// Get student profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;