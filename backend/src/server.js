// Bootstrap du serveur Express : middlewares, montage des routes, gestion d'erreurs,
// démarrage (attente Neo4j + contraintes) et arrêt propre.
import express from 'express';
import cors from 'cors';

import { waitForNeo4j, closeDriver } from './db/neo4j.js';
import { applyConstraints } from './db/schema.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

// Routes de lecture (implémentées — Alexis)
import artistsRouter from './routes/artists.js';
import recordingsRouter from './routes/recordings.js';
import releasesRouter from './routes/releases.js';
import graphRouter from './routes/graph.js';

// Routes branchées par Josué (stubs 501 pour l'instant)
import searchRouter from './routes/search.js';
import importRouter from './routes/import.js';
import statsRouter from './routes/stats.js';

const PORT = Number(process.env.BACKEND_PORT) || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Healthcheck (utilisé par le Dockerfile et docker-compose)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Montage des routes
app.use('/api/artists', artistsRouter);
app.use('/api/recordings', recordingsRouter);
app.use('/api/releases', releasesRouter);
app.use('/api/graph', graphRouter);

// --- Josué : search / import / stats (stubs 501, déjà montés) ---
app.use('/api/search', searchRouter);
app.use('/api/import', importRouter);
app.use('/api/stats', statsRouter);

// 404 + gestion d'erreurs centralisée (toujours en dernier)
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await waitForNeo4j();
    await applyConstraints();
  } catch (err) {
    console.error('[startup] impossible de joindre Neo4j, arrêt :', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`[server] MusicGraph backend à l'écoute sur http://localhost:${PORT}/api`);
  });

  // Arrêt propre : ferme le serveur HTTP puis le driver Neo4j.
  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} reçu, arrêt en cours...`);
    server.close(async () => {
      await closeDriver();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
