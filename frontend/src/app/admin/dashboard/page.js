'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCard from '@/components/admin/StatsCard';
import SubjectManager from '@/components/admin/SubjectManager';
import SubjectDetailReport from '@/components/admin/SubjectDetailReport';
import { QUESTION_DISPLAY, QUESTION_KEYS } from '@/constants/questions'; // ← shared constants
import styles from './dashboard.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmation, setClearConfirmation] = useState('');
  const [data, setData] = useState({
    totalResponses: 0,
    overallAverageRating: 0,
    highestSubject: null,
    highestFaculty: null,
    subjectWise: [],
    facultyWise: [],
    questionWise: {},
    gradeDistribution: {
      excellent: 0,
      veryGood: 0,
      good: 0,
      average: 0,
      needsImprovement: 0
    }
  });
  const [filters, setFilters] = useState({ department: '', year: '' });


  useEffect(()=>{
    const token=localStorage.getItem("token")
    const role=localStorage.getItem("role")
    if (!token||!role){
      console.log("No token or role")
      router.push("/login")
    }
    if(role=="Student"){
      console.log("Re to student")
      router.push("/student")
    }else if(role=="Admin"){

    }else{
      console.log("Wrong role")
      router.push("/login")
    }

  },[])


  const fetchDashboard = async () => {
    try {
      console.log("Fetching..")
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.year) params.append('year', filters.year);

      const response = await axios.get(
        `${API_BASE}/api/admin/dashboard?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const responseData = response.data || {};
      setData({
        totalResponses: responseData.totalResponses || 0,
        overallAverageRating: responseData.overallAverageRating || 0,
        highestSubject: responseData.highestSubject || null,
        highestFaculty: responseData.highestFaculty || null,
        subjectWise: responseData.subjectWise || [],
        facultyWise: responseData.facultyWise || [],
        questionWise: responseData.questionWise || {},
        gradeDistribution: responseData.gradeDistribution || {
          excellent: 0,
          veryGood: 0,
          good: 0,
          average: 0,
          needsImprovement: 0
        }
      });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchDashboard();
    }
  }, [filters]);

  // Clear all feedback responses
  const handleClearAllResponses = async () => {
    if (clearConfirmation !== 'CLEAR ALL RESPONSE') {
      alert('Please type "CLEAR ALL RESPONSE" to confirm deletion');
      return;
    }

    setClearing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE}/api/admin/feedback/clear-all`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          data: { confirm: clearConfirmation }
        }
      );
      
      setShowClearModal(false);
      setClearConfirmation('');
      alert('All feedback responses have been cleared successfully!');
      fetchDashboard();
    } catch (err) {
      console.error('Error clearing feedback:', err);
      alert(err.response?.data?.message || 'Failed to clear feedback responses');
    } finally {
      setClearing(false);
    }
  };

  // Helper functions
  const safeToFixed = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    return Number(value).toFixed(decimals);
  };

  const safePercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${(Number(value) * 20).toFixed(1)}%`;
  };

  // Get display label for a question key
  const getQuestionLabel = (key) => {
    return QUESTION_DISPLAY[key] || key;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.dashboard}>
        <div className={styles.topbar}>
          <h2>Feedback Dashboard</h2>
          <div className={styles.topbarActions}>
            <div className={styles.filters}>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="AI&DS">AI & DS</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
                <option value="MECH">MECH</option>
                <option value="EEE">EEE</option>
                <option value="CIVIL">CIVIL</option>
              </select>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <option value="">All Years</option>
                {[1, 2, 3, 4].map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <button 
              className={styles.clearAllBtn}
              onClick={() => setShowClearModal(true)}
              disabled={data.totalResponses === 0}
            >
              🗑️ Clear All Responses
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatsCard title="Total Responses" value={data.totalResponses || 0} />
          <StatsCard
            title="Overall Average"
            value={data.overallAverageRating ? safePercentage(data.overallAverageRating) : '0%'}
          />
          <StatsCard
            title="Highest Rated Subject"
            value={data.highestSubject ? `${data.highestSubject.subjectName} (${safeToFixed(data.highestSubject.avgRating)})` : 'N/A'}
          />
          <StatsCard
            title="Highest Rated Faculty"
            value={data.highestFaculty ? `${data.highestFaculty.facultyName} (${safeToFixed(data.highestFaculty.avgRating)})` : 'N/A'}
          />
        </div>

        <SubjectManager />

        <SubjectDetailReport subjects={data.subjectWise} />

        <div className={styles.tableSection}>
          <h3>Subject Wise Report</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Subject</th><th>Faculty</th><th>Responses</th>
                  <th>Avg (5)</th><th>Percentage</th><th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.subjectWise && data.subjectWise.length > 0 ? (
                  data.subjectWise.map((item, i) => (
                    <tr key={i}>
                      <td>{item.subjectName || 'N/A'} ({item.subjectCode || 'N/A'})</td>
                      <td>{item.facultyName || 'N/A'}</td>
                      <td>{item.responses || 0}</td>
                      <td>{safeToFixed(item.overallAvg)}</td>
                      <td>{safePercentage(item.overallAvg)}</td>
                      <td>{getGrade(item.overallAvg)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.noData}>No subject data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.tableSection}>
          <h3>Faculty Wise Report</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Faculty</th><th>Subjects</th><th>Responses</th>
                  <th>Avg (5)</th><th>Percentage</th><th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.facultyWise && data.facultyWise.length > 0 ? (
                  data.facultyWise.map((item, i) => (
                    <tr key={i}>
                      <td>{item.facultyName || 'N/A'}</td>
                      <td>{item.subjects ? item.subjects.join(', ') : 'N/A'}</td>
                      <td>{item.responses || 0}</td>
                      <td>{safeToFixed(item.overallAvg)}</td>
                      <td>{safePercentage(item.overallAvg)}</td>
                      <td>{getGrade(item.overallAvg)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.noData}>No faculty data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.tableSection}>
          <h3>Question Wise Average (Global)</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr><th>Question</th><th>Average (5)</th><th>Percentage</th></tr>
              </thead>
              <tbody>
                {data.questionWise && Object.keys(data.questionWise).length > 0 ? (
                  // Iterate only over the 20 defined question keys
                  QUESTION_KEYS.map(key => {
                    const value = data.questionWise[key];
                    if (value === undefined || value === null) return null;
                    return (
                      <tr key={key}>
                        <td>{getQuestionLabel(key)}</td>
                        <td>{safeToFixed(value)}</td>
                        <td>{safePercentage(value)}</td>
                      </tr>
                    );
                  }).filter(Boolean)
                ) : (
                  <tr>
                    <td colSpan="3" className={styles.noData}>No question data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal (unchanged) */}
      {showClearModal && (
        <div className={styles.modalOverlay} onClick={() => setShowClearModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>⚠️ Clear All Feedback Responses</h3>
              <button 
                className={styles.closeBtn} 
                onClick={() => {
                  setShowClearModal(false);
                  setClearConfirmation('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.warningIcon}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="30" stroke="#E74C3C" strokeWidth="2" fill="#FDECEC"/>
                  <path d="M32 20V36" stroke="#E74C3C" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="32" cy="44" r="2" fill="#E74C3C"/>
                </svg>
              </div>
              
              <h4>This action cannot be undone!</h4>
              <p>
                You are about to delete all <strong>{data.totalResponses}</strong> feedback responses 
                permanently from the database. This includes all subject ratings, comments, and statistics.
              </p>
              
              <div className={styles.warningList}>
                <p>⚠️ This will permanently remove:</p>
                <ul>
                  <li>All student feedback responses</li>
                  <li>All subject ratings and comments</li>
                  <li>All faculty evaluation data</li>
                  <li>All statistics and reports</li>
                </ul>
              </div>
              
              <div className={styles.confirmInput}>
                <label>Type <strong>CLEAR ALL RESPONSE</strong> to confirm:</label>
                <input
                  type="text"
                  value={clearConfirmation}
                  onChange={(e) => setClearConfirmation(e.target.value.toUpperCase())}
                  placeholder="Type CLEAR ALL RESPONSE to confirm"
                  className={styles.confirmInputField}
                  autoFocus
                />
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowClearModal(false);
                    setClearConfirmation('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className={styles.dangerBtn}
                  onClick={handleClearAllResponses}
                  disabled={clearConfirmation !== 'CLEAR ALL RESPONSE' || clearing}
                >
                  {clearing ? 'Deleting...' : 'Yes, Delete All Responses'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function getGrade(avg) {
  if (avg === null || avg === undefined || isNaN(avg)) return 'N/A';
  if (avg >= 4.5) return 'Excellent';
  if (avg >= 4.0) return 'Very Good';
  if (avg >= 3.5) return 'Good';
  if (avg >= 3.0) return 'Average';
  return 'Needs Improvement';
}