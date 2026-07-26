'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
     const response=await api.post("/api/auth/login",{identifier, password});
     if (response.data.status=="success"){
      localStorage.setItem("token",response.data.token)
      localStorage.setItem("role",response.data.role)
      if (response.data.role=="Admin"){
         router.push('/admin/dashboard');
      }
      if(response.data.role=="Student"){
        router.push("/student")
      }
     }
     if(response.data.message){
      setError(response.data.message)
     }
     
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
  const verifyUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await api.post("/api/auth/verify", { token });

      if (response.data.status === "success") {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role);

        if (response.data.role === "Admin") {
          router.replace("/admin/dashboard");
        } else if (response.data.role === "Student") {
          router.replace("/student");
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
  };

  verifyUser();
}, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your student account</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Registrated Email</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        <div className={styles.footer}>
          <Link href="/reset-password">Forgot password?</Link>
          <Link href="/signup">Create account</Link>
        </div>
      </div>
    </div>
  );
}