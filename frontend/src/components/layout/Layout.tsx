import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/search', label: 'Recherche' },
  { to: '/artists', label: 'Artistes' },
  { to: '/recordings', label: 'Morceaux' },
  { to: '/graph', label: 'Graphe' },
  { to: '/stats', label: 'Statistiques' },
];

export function Layout() {
  return (
    <>
      <nav className={styles.nav}>
        <NavLink to="/" className={styles.brand}>
          <img src="/favicon.svg" alt="" className={styles.brandMark} />
          <span>MusicGraph</span>
        </NavLink>
        <div className={styles.links}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.linkActive}` : styles.link
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
