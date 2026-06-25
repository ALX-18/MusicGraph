import styles from './StatCard.module.css';

interface Props {
  value: number | string;
  label: string;
  icon?: string;
}

export function StatCard({ value, label, icon }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.value}>
        {icon && <span>{icon} </span>}
        {value}
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
