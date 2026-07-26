import styles from './StatsCard.module.css';

export default function StatsCard({ title, value }) {
  return (
    <div className={styles.card}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}