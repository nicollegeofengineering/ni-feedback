const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const OTP = require('../models/OTP');
const sendOtp = require('../utils/sendOtp');
const Admin = require('../models/Admin');
const Feedback=require('../models/FeedBack');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ---------- STUDENT SIGNUP ----------
router.post('/signup', async (req, res) => {
  try {
    const { regno, email, password, department, year, semester } = req.body;

    if (!regno || !email || !password || !department || !year) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate regno
    if (!/^\d{12}$/.test(regno)) {
      return res.status(400).json({
        success: false,
        message: 'Registration number must be exactly 12 digits'
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Year validation
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
      return res.status(400).json({
        success: false,
        message: 'Year must be between 1 and 4'
      });
    }

    // ✅ Check if email already belongs to an Admin
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if student already exists (by regno or email)
    const existingStudent = await Student.findOne({
      $or: [{ regno }, { email }]
    });
    if (existingStudent) {
      const field = existingStudent.regno === regno ? 'Registration number' : 'Email';
      return res.status(409).json({
        success: false,
        message: `${field} already registered`
      });
    }

    // Generate OTP
    const otp = generateOTP();

    await OTP.create({
      email,
      otp,
      role: 'Student',
      type: 'verification',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOtp(email, otp, 'verification');

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please verify your email.',
      email: email,
      expiresIn: '5 minutes'
    });

  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists. Please use a different ${field}.`
      });
    }
    if (error.message === 'Failed to send OTP email') {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again later.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});


// ---------- VERIFY OTP & AUTO LOGIN (Student) ----------
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, regno, password, department, year } = req.body;

    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'verification',
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const existingStudent = await Student.findOne({ $or: [{ regno }, { email }] });
    if (existingStudent) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Student already registered' });
    }

    const student = await Student.create({
      regno,
      email,
      password,
      department,
      year,
      semester:"1",
      role: 'Student',
      status:"Active",
      isVerified: true
    });

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = jwt.sign(
      {
        id: student._id,
        regno: student.regno,
        email: student.email,
        department: student.department,
        year: student.year,
        semester: student.semester,
        role: 'Student'
      },
      process.env.JWT_SECRET,
      { expiresIn: '5hr' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      status: 'success',
      token,
      role: 'Student'
      
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ---------- LOGIN (Student + Admin) ----------
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const admin = await Admin.findOne({ email: identifier });
    if (admin) {
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(200).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: 'Admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '5hr' }
      );
      return res.json({
        token,
        status: 'success',
        role: 'Admin'
        
      });
    }

    const student = await Student.findOne({
      $or: [{ regno: identifier }, { email: identifier }]
    });

    if (!student) {
      return res.status(200).json({ message: 'Invalid credentials' });
    }

    if (!student.isVerified) {
      return res.status(200).json({ message: 'Please verify your email first' });
    }

    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(200).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: student._id,
        regno: student.regno,
        email: student.email,
        department: student.department,
        year: student.year,
        semester: student.semester,
        role: 'Student'
      },
      process.env.JWT_SECRET,
      { expiresIn: '5hr' }
    );

    return res.json({
      token,
      status: 'success',
      role: 'Student'
      
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- VERIFY TOKEN ----------
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'Student') {
      const student = await Student.findById(decoded.id).select('-password');
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const token = jwt.sign(
      {
        id: student._id,
        regno: student.regno,
        email: student.email,
        department: student.department,
        year: student.year,
        semester: student.semester,
        role: 'Student'
      },
      process.env.JWT_SECRET,
      { expiresIn: '5hr' }
    );

    return res.json({
      token,
      status: 'success',
      role: 'Student'
      
    });
      
    } else if (decoded.role === 'Admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: 'Admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '5hr' }
      );
      return res.json({
        token,
        status: 'success',
        role: 'Admin'
        
      });
    } else {
      return res.status(400).json({ message: 'Invalid token role' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ---------- UNIFIED REQUEST PASSWORD RESET (Admin + Student) ----------
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check admin first
    const admin = await Admin.findOne({ email });
    if (admin) {
      const otp = generateOTP();
      await OTP.create({
        email,
        otp,
        role: 'Admin',       // store the role for later use
        type: 'reset',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });
      await sendOtp(email, otp, 'reset');
      return res.json({ message: 'OTP sent for password reset' });
    }

    // If not admin, check student
    const student = await Student.findOne({ email });
    if (student) {
      const otp = generateOTP();
      await OTP.create({
        email,
        otp,
        role: 'Student',
        type: 'reset',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });
      await sendOtp(email, otp, 'reset');
      return res.json({ message: 'OTP sent for password reset' });
    }

    // Email not found in any collection
    return res.status(404).json({ message: 'No account found with this email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- UNIFIED RESET PASSWORD (Admin + Student) ----------
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' });
    }

    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'reset',
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Decide which model to update based on the role stored in OTP
    if (otpRecord.role === 'Admin') {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      admin.password = newPassword;
      await admin.save();
    } else if (otpRecord.role === 'Student') {
      const student = await Student.findOne({ email });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      student.password = newPassword;
      await student.save();
    } else {
      return res.status(400).json({ message: 'Invalid OTP role' });
    }

    await OTP.deleteOne({ _id: otpRecord._id });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;