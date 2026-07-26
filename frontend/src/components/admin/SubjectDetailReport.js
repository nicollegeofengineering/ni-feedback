'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { QUESTION_DISPLAY, QUESTION_KEYS } from '@/constants/questions'; // ← shared
import styles from './SubjectDetailReport.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function SubjectDetailReport({ subjects }) {
  const [selectedCode, setSelectedCode] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subjects && subjects.length > 0 && !selectedCode) {
      setSelectedCode(subjects[0].subjectCode);
    }
  }, [subjects]);

  useEffect(() => {
    if (selectedCode) fetchDetail(selectedCode);
  }, [selectedCode]);

  const fetchDetail = async (subjectCode) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_BASE}/api/admin/subject-details?subjectCode=${encodeURIComponent(subjectCode)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDetail(res.data);
    } catch (err) {
      console.error('Error fetching subject details:', err);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const safeToFixed = (v) => (v === null || v === undefined || isNaN(v) ? '0.00' : Number(v).toFixed(2));
  const safePercentage = (v) => (v === null || v === undefined || isNaN(v) ? '0.0%' : `${(Number(v) * 20).toFixed(1)}%`);

  // Helper to get display label
  const getQuestionLabel = (key) => QUESTION_DISPLAY[key] || key;

  if (!subjects || subjects.length === 0) return null;

  return (
    <div className={styles.section}>
      <h3>Subject Detailed Report</h3>

      <select
        className={styles.select}
        value={selectedCode}
        onChange={(e) => setSelectedCode(e.target.value)}
      >
        {subjects.map((s, i) => (
          <option key={i} value={s.subjectCode}>
            {s.subjectCode} - {s.subjectName} ({s.facultyName})
          </option>
        ))}
      </select>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : detail ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr><th>Question</th><th>Average (5)</th><th>Percentage</th></tr>
              </thead>
              <tbody>
                {QUESTION_KEYS.map((key) => {
                  const value = detail.averages?.[key];
                  return (
                    <tr key={key}>
                      <td>{getQuestionLabel(key)}</td>
                      <td>{safeToFixed(value)}</td>
                      <td>{safePercentage(value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4 className={styles.commentsTitle}>Student Comments</h4>
          <div className={styles.comments}>
            {detail.comments && detail.comments.length > 0 ? (
              detail.comments.map((c, i) => (
                <div key={i} className={styles.commentItem}>{c.comment}</div>
              ))
            ) : (
              <div className={styles.noData}>No comments available</div>
            )}
          </div>
        </>
      ) : (
        <div className={styles.noData}>No data available</div>
      )}
    </div>
  );
}