// STUB — À IMPLÉMENTER PAR JOSUÉ (statistiques du graphe).
// Agrégations Cypher sur les données déjà importées.
//
// Contrat (docs/CONTRACT.md) :
//   GET /api/stats/overview          -> { artists, recordings, releases, collaborations, genres }
//   GET /api/stats/top-collaborations -> { a: Artist, b: Artist, weight }[]
//   GET /api/stats/top-artists       -> { artist: Artist, degree }[]
//   GET /api/stats/top-genres        -> { name, count }[]
//
// Helpers réutilisables :
//   import { runQuery } from '../db/neo4j.js';
//   import { toArtist } from '../utils/mappers.js';
//   import { toNumber } from '../utils/mappers.js';   // Integer Neo4j -> Number
//   import { parsePagination } from '../utils/pagination.js';  // pour ?limit= sur les "top"
import { Router } from 'express';

const router = Router();

// GET /api/stats/overview
router.get('/overview', (req, res) => {
  // TODO(Josué): MATCH counts par label + count des relations COLLABORATED_WITH + Genre.
  res.status(501).json({ error: 'Not Implemented — /api/stats/overview (Josué)' });
});

// GET /api/stats/top-collaborations
router.get('/top-collaborations', (req, res) => {
  // TODO(Josué): MATCH (a)-[c:COLLABORATED_WITH]->(b) ORDER BY c.weight DESC.
  res.status(501).json({ error: 'Not Implemented — /api/stats/top-collaborations (Josué)' });
});

// GET /api/stats/top-artists
router.get('/top-artists', (req, res) => {
  // TODO(Josué): degré = nombre de relations par Artist, ORDER BY degree DESC.
  res.status(501).json({ error: 'Not Implemented — /api/stats/top-artists (Josué)' });
});

// GET /api/stats/top-genres
router.get('/top-genres', (req, res) => {
  // TODO(Josué): MATCH (:Artist)-[:ASSOCIATED_WITH_GENRE]->(g:Genre) count par genre.
  res.status(501).json({ error: 'Not Implemented — /api/stats/top-genres (Josué)' });
});

export default router;
