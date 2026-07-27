'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from './students.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function AdminStudents() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ year: '', department: '', submitted: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFeedback, setStudentFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Load students on mount and when filters change
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchStudents();
  }, [router, filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.department) params.append('department', filters.department);
      if (filters.submitted) params.append('submitted', filters.submitted);

      const response = await axios.get(
        `${API_BASE}/api/admin/students?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(response.data);
    } catch (err) {
      
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Promotion Action ----------
  const handlePromoteAll = async () => {
    const userInput = window.prompt('Type PROMOTE STUDENTS to continue');
    if (userInput !== 'PROMOTE STUDENTS') {
      alert('Promotion cancelled.');
      return;
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE}/api/admin/students/promote-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Promotion failed');
    }finally{
      setLoading(false)
    }
  };

  // ---------- Reverse Promotion Action ----------
  const handleReversePromotion = async () => {
    const userInput = window.prompt('Type REVERSE PROMOTION to continue');
    if (userInput !== 'REVERSE PROMOTION') {
      alert('Reverse promotion cancelled.');
      return;
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE}/api/admin/students/reverse-promotion`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Reverse promotion failed');
    }finally{
      setLoading(false)
    }
  };

  // ---------- Delete Student ----------
  const handleDeleteStudent = async (regno) => {
    const userInput = window.prompt('Type DELETE STUDENT to permanently delete this student.');
    if (userInput !== 'DELETE STUDENT') {
      alert('Deletion cancelled.');
      return;
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE}/api/admin/students/${regno}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { confirmation: 'DELETE STUDENT' }
        }
      );
      alert('Student deleted successfully.');
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }finally{
      setLoading(false)
    }
  };

  // ---------- View Feedback (unchanged) ----------
  const fetchStudentFeedback = async (regno) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/api/admin/students/${regno}/feedback`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudentFeedback(response.data);
      setSelectedStudent(regno);
      setShowFeedbackModal(true);
    } catch (err) {
      console.error('Error fetching student feedback:', err);
      alert('Failed to fetch student feedback');
    }
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedStudent(null);
    setStudentFeedback(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading students...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <h2>Student Management</h2>
            <span className={styles.studentCount}>
                  Total Students: {students.length}
            </span>
          </div>
          <div className={styles.filters}>
            <select value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}>
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            <select value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}>
              <option value="">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="AI&DS">AI & DS</option>
              <option value="ECE">ECE</option>
              <option value="IT">IT</option>
              <option value="MECH">MECH</option>
              <option value="EEE">EEE</option>
              <option value="CIVIL">CIVIL</option>
            </select>
            <select value={filters.submitted} onChange={(e) => handleFilterChange('submitted', e.target.value)}>
              <option value="">All Students</option>
              <option value="true">Submitted Feedback</option>
              <option value="false">Not Submitted</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionBar}>
          <button onClick={handlePromoteAll} className={styles.btnPrimary}>
            Promote All Students
          </button>
          <button onClick={handleReversePromotion} className={styles.btnWarning}>
            Reverse Promotion
          </button>
          
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableWrapper}>
            {students.length === 0 ? (
              <p className={styles.noData}>No students found matching the filters</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.regno}>
                      <td><strong>{student.regno}</strong></td>
                      <td>{student.email}</td>
                      <td>{student.department}</td>
                      <td>{student.year}</td>
                      <td>
                        {student.status === 'Active' ? (
                          <span className={styles.statusActive}>Active</span>
                        ) : (
                          <span className={styles.statusPassedOut}>Passed Out</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteStudent(student.regno)}
                          className={styles.btnDanger}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Feedback Modal (unchanged) */}
        {showFeedbackModal && studentFeedback && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>Feedback for {studentFeedback.student.regno}</h3>
              {/* ... render feedback details ... */}
              <button onClick={closeFeedbackModal} className={styles.btnPrimary}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}