'use client';

import styles from './SubjectCard.module.css';

const QUESTION_DISPLAY = {
  regularClassAttendance: 'The faculty comes to class regularly.',
  classPunctuality: 'The faculty is punctual in attending classes.',
  teachingSincerity: 'The faculty is sincere and committed to teaching.',
  subjectKnowledge: 'The faculty has good knowledge of the subject.',
  conceptExplanation: 'The faculty explains concepts clearly and effectively.',
  teachingMethod: 'The teaching methods used by the faculty are easy to understand.',
  teachingAidsUsage: 'The faculty uses the blackboard/whiteboard, presentations (PPT), and other teaching aids effectively.',
  practicalExamples: 'The faculty uses relevant examples and practical applications while teaching.',
  studentParticipation: 'The faculty encourages students to ask questions and participate in class.',
  doubtClarification: 'The faculty responds to students\' doubts clearly and patiently.',
  syllabusCompletion: 'The faculty completes the syllabus within the scheduled time.',
  classTestsConduct: 'The faculty conducts class tests/internal assessments regularly.',
  testPaperEvaluation: 'The faculty evaluates and returns test papers promptly.',
  assignmentsEffectiveness: 'The assignments and class activities help in understanding the subject.',
  classroomDiscipline: 'The faculty maintains discipline and effectively controls the classroom.',
  professionalBehaviour: 'The faculty behaves professionally and courteously with students.',
  studentApproachability: 'The faculty is approachable and willing to help students with academic difficulties.',
  studyMaterials: 'The study materials, notes, or reference materials provided by the faculty are helpful.',
  revisionBeforeExams: 'The faculty completes the planned portions before examinations and conducts revision classes when required.',
  classPreparation: 'The faculty is well-prepared for every class.'
};

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function SubjectCard({
  subject,
  feedbackKey,          // NEW PROP: unique identifier (e.g., "subjectCode||facultyName")
  ratings,
  comment,
  onRatingChange,
  onCommentChange,
}) {
  const { subjectCode, subjectName, facultyName } = subject;

  // Use feedbackKey for all radio groups and IDs to keep teachers separate
  const handleRating = (key, value) => {
    onRatingChange(feedbackKey, key, Number(value));
  };

  const handleComment = (e) => {
    onCommentChange(feedbackKey, e.target.value);
  };

  // Calculate progress for each rating
  const getRatingProgress = (key) => {
    const value = ratings[key];
    if (value === null || value === undefined) return 0;
    return (value / 5) * 100;
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.subjectTitle}>
            {subjectCode}
            <span className={styles.subjectName}> - {subjectName}</span>
          </h3>
          <div className={styles.facultyBadge}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="#2563eb"/>
              <path d="M8 10C4.68629 10 2 12.6863 2 16H14C14 12.6863 11.3137 10 8 10Z" fill="#2563eb"/>
            </svg>
            <span>{facultyName}</span>
          </div>
        </div>
        <div className={styles.progressIndicator}>
          <span className={styles.progressText}>
            {Object.values(ratings).filter(v => v !== null).length}/{Object.keys(QUESTION_DISPLAY).length} answered
          </span>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${(Object.values(ratings).filter(v => v !== null).length / Object.keys(QUESTION_DISPLAY).length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.ratingsGrid}>
        {Object.entries(QUESTION_DISPLAY).map(([key, label]) => {
          const currentRating = ratings[key];
          const progress = getRatingProgress(key);
          
          return (
            <div key={key} className={styles.ratingItem}>
              <div className={styles.ratingHeader}>
                <label className={styles.ratingLabel}>{label}</label>
                {currentRating !== null && (
                  <span className={styles.ratingValue}>
                    {currentRating} - {RATING_LABELS[currentRating]}
                  </span>
                )}
              </div>
              
              <div className={styles.ratingOptions}>
                {[1, 2, 3, 4, 5].map((val) => {
                  // Unique ID using feedbackKey to avoid collisions between staff
                  const id = `${feedbackKey}_${key}_${val}`;
                  const isChecked = ratings[key] === val;
                  
                  return (
                    <span key={val} className={styles.ratingOptionWrapper}>
                      <input
                        type="radio"
                        id={id}
                        name={`${feedbackKey}_${key}`}   // Group by feedbackKey + question key
                        value={val}
                        checked={isChecked}
                        onChange={() => handleRating(key, val)}
                        className={styles.radioInput}
                      />
                      <label 
                        htmlFor={id} 
                        className={`${styles.ratingOption} ${isChecked ? styles.checked : ''}`}
                        data-value={val}
                      >
                        {val}
                      </label>
                    </span>
                  );
                })}
              </div>
              
              {currentRating !== null && (
                <div className={styles.ratingProgress}>
                  <div 
                    className={styles.ratingProgressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.commentArea}>
        <label htmlFor={`${feedbackKey}_comment`} className={styles.commentLabel}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 0H2C0.9 0 0.01 0.9 0.01 2L0 14L3 11H14C15.1 11 16 10.1 16 9V2C16 0.9 15.1 0 14 0ZM14 9H3L2 10L1 11V2H14V9Z" fill="#64748b"/>
          </svg>
          Additional Comments (Optional)
        </label>
        <textarea
          id={`${feedbackKey}_comment`}
          rows={3}
          placeholder="Share any additional feedback or suggestions about this course or faculty..."
          value={comment}
          onChange={handleComment}
          className={styles.commentTextarea}
        />
        <div className={styles.characterCount}>
          {comment ? comment.length : 0} characters
        </div>
      </div>
    </div>
  );
}