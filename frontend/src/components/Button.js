'use client';

import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', loading, ...props }) {
  return (
    <button className={`${styles.btn} ${styles[variant]}`} disabled={loading} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  );
}