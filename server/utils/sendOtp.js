const nodemailer = require('nodemailer');

const sendOtp = async (email, otp, type = 'verification') => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const subject = type === 'reset' 
      ? 'Password Reset OTP - College Feedback System'
      : 'Email Verification OTP - College Feedback System';
    
    const text = type === 'reset'
      ? `Your password reset OTP is ${otp}. It expires in 5 minutes.`
      : `Your email verification OTP is ${otp}. It expires in 5 minutes.`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: text
    };
    await transporter.verify();
console.log("SMTP verified successfully");
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = sendOtp;