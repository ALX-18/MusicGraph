import type { ReactNode } from 'react';
import styles from './Table.module.css';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  numeric?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T, index: number) => string;
}

export function Table<T>({ columns, rows, keyOf }: Props<T>) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={c.numeric ? styles.num : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={keyOf(row, i)}>
              {columns.map((c) => (
                <td key={c.header} className={c.numeric ? styles.num : undefined}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
