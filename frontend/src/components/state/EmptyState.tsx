import type { ReactNode } from 'react';
import styles from './States.module.css';

interface Props {
  title?: string;
  message?: string;
  icon?: string;
  children?: ReactNode;
}

export function EmptyState({
  title = 'Rien à afficher',
  message,
  icon = '🗂️',
  children,
}: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon}</div>
      <p className={styles.title}>{title}</p>
      {message && <p className={styles.message}>{message}</p>}
      {children}
    </div>
  );
}
