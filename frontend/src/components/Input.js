'use client';

import styles from './Input.module.css';

export default function Input({ 
  label, 
  type = 'text', 
  name,
  value,
  onChange,
  placeholder,
  required = false,
  ...props 
}) {
  return (
    <div className={styles.group}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={styles.input}
        {...props}
      />
    </div>
  );
}