'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './SubjectManager.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function SubjectManager() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    department: '',
    year: '',
    semester: '',
    subjectCode: '',
    subjectName: '',
    facultyName: ''
  });
  const [loading, setLoading] = useState(false);

  const yearSemMap = {
    "1": [1, 2],
    "2": [3, 4],
    "3": [5, 6],
    "4": [7, 8]
  };

  const [expand,setExpand]=useState(false);
  useEffect(() => {
    fetchSubjects();
  }, [form.department, form.year, form.semester]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (form.department) params.append('department', form.department);
      if (form.year) params.append('year', form.year);
      if (form.semester) params.append('semester', form.semester);

      const response = await axios.get(
        `${API_BASE}/api/admin/subjects?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubjects(response.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/admin/subjects`,
        {
          ...form,
          year: parseInt(form.year),
          semester: parseInt(form.semester)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Subject added successfully!');
      setForm({
        department: '',
        year: '',
        semester: '',
        subjectCode: '',
        subjectName: '',
        facultyName: ''
      });
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE}/api/admin/subjects/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSubjects();
    } catch (err) {
      alert('Failed to delete subject');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'year') {
      setForm(prev => ({ ...prev, year: value, semester: '' }));
    }
  };

  return (
    <div className={styles.container}>
      <h3>Manage Subjects</h3>
      
    {expand?(
      <>
      <h4 style={{ marginTop: '1.5rem' ,color:'white'}}>Existing Subjects <span className={`${styles.arrow} ${expand ? styles.open : ""}`}
                onClick={() => setExpand(!expand)}>▶</span></h4>
      
      <div className={styles.tableWrapper}>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Department</th><th>Year</th>
              <th>Subject Code</th><th>Subject Name</th><th>Faculty</th>
              
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub, index)  => (
              <tr key={`${sub.subjectCode}-${sub.facultyName}-${index}`}>
                <td>{sub.department}</td>
                <td>{sub.year}</td>
                <td>{sub.subjectCode}</td>
                <td>{sub.subjectName}</td>
                <td>{sub.facultyName}</td>
                
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.expandbtn}>
      <span
        className={`${styles.arrowd} ${expand ? styles.opend : ""}`}
        onClick={() => setExpand(!expand)}
      >
        ▶
      </span>
    </div>
      </div>
      </>
    ):(<div className={styles.expandbtn}>
      <button onClick={()=>{setExpand(true)}}>View all</button>
    </div>)}
      
    </div>
  );
}