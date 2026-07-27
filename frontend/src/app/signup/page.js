'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import OTPInput from '@/components/OTPInput';
import styles from './signup.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ 
    regno: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    department: '',
    year: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regnoError, setRegnoError] = useState('');
  const [emailError, setEmailError] = useState('');

  const yearSemMap = {
    "1": [1, 2],
    "2": [3, 4],
    "3": [5, 6],
    "4": [7, 8]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For registration number: only allow numbers
    if (name === 'regno') {
      // Remove any non-numeric characters
      const sanitizedValue = value.replace(/[^0-9]/g, '');
      
      // Limit to 15 digits
      if (sanitizedValue.length > 15) {
        return;
      }
      
      // Real-time validation hints
      if (sanitizedValue.length > 0 && sanitizedValue.length < 12) {
        setRegnoError('Registration number should be 12 digits');
      } else if (sanitizedValue.length === 12) {
        setRegnoError('');
      } else if (sanitizedValue.length > 12) {
        setRegnoError('Maximum 12 digits allowed');
      } else {
        setRegnoError('');
      }
      
      setForm({ ...form, [name]: sanitizedValue });
      return;
    }
    
    // For email: preserve valid email characters
    if (name === 'email') {
      const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9@._+-]/g, '');
      
      // Basic email validation
      if (sanitizedValue.length > 0) {
        if (sanitizedValue.includes('@')) {
          const parts = sanitizedValue.split('@');
          if (parts.length === 2 && parts[1].includes('.')) {
            setEmailError('');
          } else {
            setEmailError('Please enter a valid email address');
          }
        } else {
          setEmailError('Email must contain @ symbol');
        }
      } else {
        setEmailError('');
      }
      
      setForm({ ...form, [name]: sanitizedValue });
      return;
    }
    
    setForm({ ...form, [name]: value });
    
    // Reset semester when year changes
    if (name === 'year') {
      setForm(prev => ({ ...prev, year: value, semester: '' }));
    }
  };

  // Validate registration number (purely numeric)
  const validateRegno = (regno) => {
    if (!regno) {
      return { valid: false, message: 'Registration number is required' };
    }
    if (!/^\d+$/.test(regno)) {
      return { valid: false, message: 'Registration number must contain only numbers' };
    }
    if (regno.length !== 12) {
      return { valid: false, message: 'Registration number must be exactly 12 digits' };
    }
    return { valid: true, message: '' };
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Signup API call with Axios
  const signupUser = async (data) => {
    try {
      const response = await api.post('/api/auth/signup', data);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Signup failed');
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error(error.message || 'Signup failed');
      }
    }
  };

  // Verify OTP API call with Axios
  const verifyOTP = async (data) => {
    try {
      const response = await api.post('/api/auth/verify-otp', data);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'OTP verification failed');
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error(error.message || 'OTP verification failed');
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate registration number
    const regnoValidation = validateRegno(form.regno);
    if (!regnoValidation.valid) {
      setError(regnoValidation.message);
      return;
    }
    
    // Validate email
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address (e.g., student@example.com)');
      return;
    }
    
    // Validate password
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // Validate department
    if (!form.department) {
      setError('Please select your department');
      return;
    }
    
    // Validate year
    if (!form.year) {
      setError('Please select your year');
      return;
    }
    
   

    setLoading(true);
    try {
      await signupUser(form);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await verifyOTP({ 
        email: form.email, 
        otp,
        regno: form.regno,
        password: form.password,
        department: form.department,
        year: parseInt(form.year),
        semester: parseInt(form.semester)
      });
      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    try {
      await signupUser(form);
      alert('OTP resent successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <Card>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Register to provide feedback</p>

        {step === 1 ? (
          <form onSubmit={handleSignup}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Registration Number</label>
              <input
                type="text"
                name="regno"
                value={form.regno}
                onChange={handleChange}
                placeholder="Enter 12-digit registration number"
                className={`${styles.input} ${regnoError ? styles.inputError : ''}`}
                required
                maxLength={12}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              {regnoError && <p className={styles.hintError}>{regnoError}</p>}
              <p className={styles.hint}>Enter your 12-digit registration number</p>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="student@email.com"
                className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                required
              />
              {emailError && <p className={styles.hintError}>{emailError}</p>}
              <p className={styles.hint}>Enter a valid email address</p>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className={styles.input}
                required
                minLength={6}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={styles.input}
                required
                minLength={6}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Department</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value="">Select Department</option>
                <option value="CSE">Computer Science & Engineering</option>
                <option value="AI&DS">AI & Data Science</option>
                <option value="ECE">Electronics & Communication</option>
                <option value="IT">Information Technology</option>
                <option value="MECH">Mechanical Engineering</option>
                <option value="EEE">Electrical & Electronics</option>
                <option value="CIVIL">Civil Engineering</option>
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Year</label>
                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              
            </div>

            {error && <p className={styles.error}>{error}</p>}
            
            <Button type="submit" loading={loading}>
              Sign Up
            </Button>
          </form>
        ) : (
          <div className={styles.otpSection}>
            <div className={styles.otpIcon}>
              <svg width="60" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="#2563eb" strokeWidth="2" fill="#eff6ff" />
                <path d="M20 32L28 40L44 24" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <p className={styles.otpInfo}>
              Enter the 6‑digit verification code sent to <strong>{form.email}</strong>
            </p>
            <p className={styles.otpSubInfo}>
              Please check your spam folder if you don't see the email.
            </p>
            
            <OTPInput length={6} onComplete={setOtp} />
            
            {error && <p className={styles.error}>{error}</p>}
            
            <Button onClick={handleVerifyOTP} loading={loading}>
              Verify Email
            </Button>
            
            <button
              type="button"
              className={styles.resend}
              onClick={handleResendOTP}
            >
              Resend OTP
            </button>
          </div>
        )}

        <div className={styles.footer}>
          <Link href="/login">Already have an account? Login</Link>
        </div>
      </Card>
    </div>
  );
}