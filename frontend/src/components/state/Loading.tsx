import styles from './States.module.css';

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <p className={styles.message}>{label}</p>
    </div>
  );
}
