'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import SubjectCard from '@/components/SubjectCard';
import Loader from '@/components/Loader';
import styles from './student.module.css';
import Image from 'next/image';

import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const QUESTION_KEYS = [
  'regularClassAttendance',
  'classPunctuality',
  'teachingSincerity',
  'subjectKnowledge',
  'conceptExplanation',
  'teachingMethod',
  'teachingAidsUsage',
  'practicalExamples',
  'studentParticipation',
  'doubtClarification',
  'syllabusCompletion',
  'classTestsConduct',
  'testPaperEvaluation',
  'assignmentsEffectiveness',
  'classroomDiscipline',
  'professionalBehaviour',
  'studentApproachability',
  'studyMaterials',
  'revisionBeforeExams',
  'classPreparation'
];

export default function StudentPage() {
  const { user, logout } = useAuth();
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [feedbackData, setFeedbackData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(()=>{
      const token=localStorage.getItem("token")
  const role=localStorage.getItem("role")

    if (!token||!role){
      console.log("No token or role")
      router.push("/login")
    }
    if(role=="Admin"){
      console.log("Re to admin")
      router.push("/admin/dashboard")
    }else if(role=="Student"){

    }else{
      console.log("Wrong role")
      router.push("/login")
    }

  },[])

  // All API calls directly in the component
  useEffect(() => {
    async function loadData() {
      const role=localStorage.getItem("role")
      const token = localStorage.getItem("token");
      if (role!="Student") return;
      try {
        
        if (!token) {
          setError('Please login again');
          setLoading(false);
          return;
        }

        // 1. Fetch student profile
        const studentRes = await fetch(`${API_BASE}/api/student/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!studentRes.ok) throw new Error('Failed to fetch student data');
        const studentData = await studentRes.json();
        setStudent(studentData);

        // 2. Check if feedback already submitted (optional – see note below)
        const checkRes = await fetch(`${API_BASE}/api/feedback/check`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.submitted) {
            setSubmitted(true);
            setLoading(false);
            return;
          }
        }

        // 3. Fetch subjects
        const params = new URLSearchParams({
          department: studentData.department,
          year: studentData.year,
          semester: studentData.semester,
        });
        const subjectsRes = await fetch(
          `${API_BASE}/api/subjects?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!subjectsRes.ok) throw new Error('Failed to fetch subjects');
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData);

        // 4. Initialize feedback data using UNIQUE keys
        const initial = {};
        subjectsData.forEach((sub) => {
          const uniqueKey = `${sub.subjectCode}||${sub.facultyName}`;
          initial[uniqueKey] = {
            ratings: QUESTION_KEYS.reduce((acc, k) => ({ ...acc, [k]: null }), {}),
            comment: '',
            subjectCode: sub.subjectCode,
            facultyName: sub.facultyName,
            subjectName: sub.subjectName, // for submission payload
          };
        });
        setFeedbackData(initial);

      } catch (err) {
        console.error('Error:', err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handlers now receive the unique key
  const handleRatingChange = (uniqueKey, questionKey, value) => {
    setFeedbackData((prev) => ({
      ...prev,
      [uniqueKey]: {
        ...prev[uniqueKey],
        ratings: { ...prev[uniqueKey].ratings, [questionKey]: value },
      },
    }));
  };

  const handleCommentChange = (uniqueKey, comment) => {
    setFeedbackData((prev) => ({
      ...prev,
      [uniqueKey]: { ...prev[uniqueKey], comment },
    }));
  };

  const handleSubmit = async () => {
    // Validate all ratings are filled
    let allValid = true;
    for (const uniqueKey in feedbackData) {
      const entry = feedbackData[uniqueKey];
      if (Object.values(entry.ratings).some((v) => v === null)) {
        allValid = false;
        break;
      }
    }
    if (!allValid) {
      alert('Please answer all rating questions for every subject.');
      return;
    }

    // Build payload: each entry already contains subjectCode, facultyName, ratings, comment
    const payload = Object.values(feedbackData).map((entry) => ({
      department: student.department,
      year: student.year,
      semester: student.semester,
      subjectCode: entry.subjectCode,
      subjectName: entry.subjectName,
      facultyName: entry.facultyName,
      ratings: entry.ratings,
      comment: entry.comment,
    }));

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Submission failed');
      }

      alert('Feedback submitted successfully!');
      setSubmitted(true);
    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.btnPrimary}>
            Retry
          </button>
          <button onClick={logout} className={styles.btnSecondary} style={{ marginTop: '0.5rem' }}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.alreadySubmitted}>
            <div className={styles.submittedIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="#0B5ED7" strokeWidth="3" fill="#EAF3FF" />
                <path d="M14 24L21 31L34 18" stroke="#0B5ED7" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h2>You have already submitted your feedback</h2>
            <p>Thank you for your valuable feedback. You cannot submit again.</p>
            <button onClick={logout} className={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    
      <div className={styles.container}>
        <header className={styles.mainHeader}>
          <div className={styles.headerContent}>
            <div className={styles.logoArea}>
              <Image src="/niicon.png" width={60} height={60} alt="Logo" />
              <h1>NICETECH</h1>
            </div>
            <button onClick={logout} className={styles.logoutBtn}>Logout</button>
          </div>
          <div className={styles.headerInfo}>
            <p><strong>Student:</strong> {student?.regno} | {student?.email}</p>
            <p><strong>Department:</strong> {student?.department} | Year: {student?.year} </p>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.formCard}>
            <div className={styles.introText}>
              <h2>Course Feedback Form</h2>
              <p>
                Please evaluate each criterion using the 5‑point scale (1 = Strongly Disagree/Poor, 5 = Strongly Agree/Excellent).
                Your responses are anonymous and will be used for academic improvement.
              </p>
            </div>

            <div className={styles.subjectsContainer}>
              {subjects.length === 0 ? (
                <p className={styles.placeholderMsg}>No subjects found for your class.</p>
              ) : (
                subjects.map((sub) => {
                  const uniqueKey = `${sub.subjectCode}||${sub.facultyName}`;
                  return (
                    <SubjectCard
                      key={uniqueKey}
                      subject={sub}
                      feedbackKey={uniqueKey}
                      ratings={feedbackData[uniqueKey]?.ratings || {}}
                      comment={feedbackData[uniqueKey]?.comment || ''}
                      onRatingChange={handleRatingChange}
                      onCommentChange={handleCommentChange}
                    />
                  );
                })
              )}
            </div>

            {subjects.length > 0 && (
              <div className={styles.submitRow}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    
  );
}