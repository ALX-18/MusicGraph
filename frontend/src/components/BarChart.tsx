import styles from './BarChart.module.css';

export interface BarDatum {
  label: string;
  value: number;
}

// Bar chart horizontal léger (CSS pur, zéro dépendance).
export function BarChart({ data }: { data: BarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={styles.chart}>
      {data.map((d, i) => (
        <div className={styles.row} key={`${d.label}-${i}`}>
          <span className={styles.label} title={d.label}>
            {d.label}
          </span>
          <span className={styles.track}>
            <span
              className={styles.fill}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </span>
          <span className={styles.value}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}
