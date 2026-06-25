import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const FEATURES = [
  {
    to: '/search',
    icon: '🔎',
    title: 'Rechercher & importer',
    desc: 'Cherche un artiste dans MusicBrainz et ajoute-le au graphe.',
  },
  {
    to: '/artists',
    icon: '🎤',
    title: 'Explorer les artistes',
    desc: 'Parcours les artistes importés, leurs morceaux et leurs sorties.',
  },
  {
    to: '/graph',
    icon: '🕸️',
    title: 'Visualiser le graphe',
    desc: 'Navigue dans les collaborations de façon interactive.',
  },
  {
    to: '/stats',
    icon: '📊',
    title: 'Voir les statistiques',
    desc: 'Top artistes, collaborations et genres en un coup d’œil.',
  },
];

export function HomePage() {
  return (
    <div className="page">
      <section className={styles.hero}>
        <h1 className={styles.title}>MusicGraph</h1>
        <p className={styles.lead}>
          Explore les collaborations musicales à partir des données MusicBrainz : artistes,
          morceaux, sorties et le réseau qui les relie, sous forme de graphe interactif.
        </p>
        <div className={styles.actions}>
          <Link className="btn" to="/search">
            🔎 Rechercher un artiste
          </Link>
          <Link className="btn btn-secondary" to="/graph">
            🕸️ Ouvrir le graphe
          </Link>
        </div>
      </section>

      <section className={styles.cards}>
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className={styles.featureCard}>
            <div className={styles.featureIcon}>{f.icon}</div>
            <div className={styles.featureTitle}>{f.title}</div>
            <div className={styles.featureDesc}>{f.desc}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
