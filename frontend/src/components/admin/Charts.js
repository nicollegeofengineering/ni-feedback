'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import styles from './Charts.module.css';

export default function Charts({ data }) {
  const subjectChartRef = useRef(null);
  const facultyChartRef = useRef(null);
  const gradeChartRef = useRef(null);
  const subjectChartInstance = useRef(null);
  const facultyChartInstance = useRef(null);
  const gradeChartInstance = useRef(null);

  useEffect(() => {
    if (!data) return;

    // Subject Chart
    if (subjectChartRef.current) {
      if (subjectChartInstance.current) {
        subjectChartInstance.current.destroy();
      }
      subjectChartInstance.current = new Chart(subjectChartRef.current, {
        type: 'bar',
        data: {
          labels: data.subjectWise?.map(i => `${i.subjectName} (${i.subjectCode})`) || [],
          datasets: [{
            label: 'Average (%)',
            data: data.subjectWise?.map(i => (i.overallAvg * 20).toFixed(1)) || [],
            backgroundColor: '#0B5ED7'
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { max: 100, beginAtZero: true } }
        }
      });
    }

    // Faculty Chart
    if (facultyChartRef.current) {
      if (facultyChartInstance.current) {
        facultyChartInstance.current.destroy();
      }
      facultyChartInstance.current = new Chart(facultyChartRef.current, {
        type: 'bar',
        data: {
          labels: data.facultyWise?.map(i => i.facultyName) || [],
          datasets: [{
            label: 'Average (%)',
            data: data.facultyWise?.map(i => (i.overallAvg * 20).toFixed(1)) || [],
            backgroundColor: '#2563EB'
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { max: 100, beginAtZero: true } }
        }
      });
    }

    // Grade Distribution Chart
    if (gradeChartRef.current) {
      if (gradeChartInstance.current) {
        gradeChartInstance.current.destroy();
      }
      const grades = data.gradeDistribution || {
        excellent: 0, veryGood: 0, good: 0, average: 0, needsImprovement: 0
      };
      gradeChartInstance.current = new Chart(gradeChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Excellent', 'Very Good', 'Good', 'Average', 'Needs Improvement'],
          datasets: [{
            data: [
              grades.excellent,
              grades.veryGood,
              grades.good,
              grades.average,
              grades.needsImprovement
            ],
            backgroundColor: ['#0B5ED7', '#2E7EEA', '#5C9CF0', '#A3C6FB', '#D6E4F0']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    return () => {
      if (subjectChartInstance.current) subjectChartInstance.current.destroy();
      if (facultyChartInstance.current) facultyChartInstance.current.destroy();
      if (gradeChartInstance.current) gradeChartInstance.current.destroy();
    };
  }, [data]);

  return (
    <div className={styles.chartsRow}>
      <div className={styles.chartContainer}>
        <h3>Subject Wise Average (%)</h3>
        <canvas ref={subjectChartRef}></canvas>
      </div>
      <div className={styles.chartContainer}>
        <h3>Faculty Wise Average (%)</h3>
        <canvas ref={facultyChartRef}></canvas>
      </div>
      <div className={styles.chartContainer}>
        <h3>Grade Distribution</h3>
        <canvas ref={gradeChartRef}></canvas>
      </div>
    </div>
  );
}