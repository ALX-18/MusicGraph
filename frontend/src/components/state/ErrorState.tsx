import styles from './States.module.css';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className={styles.wrap} role="alert">
      <div className={styles.icon}>⚠️</div>
      <p className={`${styles.title} ${styles.error}`}>Une erreur est survenue</p>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}
