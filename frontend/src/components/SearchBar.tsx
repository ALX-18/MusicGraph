import { useState, type FormEvent } from 'react';
import styles from './SearchBar.module.css';

interface Props {
  onSearch: (q: string) => void;
  placeholder?: string;
  initialValue?: string;
  loading?: boolean;
}

export function SearchBar({ onSearch, placeholder, initialValue = '', loading }: Props) {
  const [value, setValue] = useState(initialValue);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form className={styles.form} onSubmit={submit} role="search">
      <input
        className={styles.input}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? 'Rechercher…'}
        aria-label="Recherche"
      />
      <button className="btn" type="submit" disabled={loading || !value.trim()}>
        {loading ? 'Recherche…' : 'Rechercher'}
      </button>
    </form>
  );
}
