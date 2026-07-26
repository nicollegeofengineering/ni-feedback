'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { requestReset, resetPassword } from '@/lib/api';
import styles from './reset-password.module.css';

export default function ResetPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [regno, setRegno] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestReset({ email });
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ regno, email, otp, newPassword });
      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card>
        <h1 className={styles.title}>Reset Password</h1>
        {step === 1 ? (
          <form onSubmit={handleRequestReset}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" loading={loading}>Send OTP</Button>
          </form>
        ) : (
          <div className={styles.otpSection}>
            <p className={styles.otpInfo}>
              Enter the OTP sent to <strong>{email}</strong>
            </p>
            <Input
              label="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              placeholder="6-digit code"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button onClick={handleReset} loading={loading}>Reset Password</Button>
          </div>
        )}
        <div className={styles.footer}>
          <Link href="/login">Back to Login</Link>
        </div>
      </Card>
    </div>
  );
}