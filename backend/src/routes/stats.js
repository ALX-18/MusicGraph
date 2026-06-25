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
import { runQuery } from '../db/neo4j.js';
import { toArtist, toNumber } from '../utils/mappers.js';
import { parsePagination } from '../utils/pagination.js';

const router = Router();

// GET /api/stats/overview
router.get('/overview', async (req, res, next) => {
  try {
    const cypher = `
      MATCH (a:Artist)
      WITH count(a) as artists
      MATCH (r:Recording)
      WITH artists, count(r) as recordings
      MATCH (rel:Release)
      WITH artists, recordings, count(rel) as releases
      MATCH (g:Genre)
      WITH artists, recordings, releases, count(g) as genres
      MATCH ()-[c:COLLABORATED_WITH]->()
      RETURN artists, recordings, releases, genres, count(c) as collaborations
    `;

    const records = await runQuery(cypher);
    if (records.length === 0) {
      return res.json({
        artists: 0,
        recordings: 0,
        releases: 0,
        collaborations: 0,
        genres: 0,
      });
    }

    const rec = records[0];
    res.json({
      artists: toNumber(rec.get('artists')),
      recordings: toNumber(rec.get('recordings')),
      releases: toNumber(rec.get('releases')),
      collaborations: toNumber(rec.get('collaborations')),
      genres: toNumber(rec.get('genres')),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/top-collaborations
router.get('/top-collaborations', async (req, res, next) => {
  try {
    const { limitInt, offsetInt } = parsePagination(req.query);

    const cypher = `
      MATCH (a:Artist)-[c:COLLABORATED_WITH]->(b:Artist)
      RETURN a, b, c.weight as weight
      ORDER BY weight DESC
      LIMIT $limit
      OFFSET $offset
    `;

    const records = await runQuery(cypher, { limit: limitInt, offset: offsetInt });

    const results = records.map((rec) => ({
      a: toArtist(rec.get('a')),
      b: toArtist(rec.get('b')),
      weight: toNumber(rec.get('weight')),
    }));

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/top-artists
router.get('/top-artists', async (req, res, next) => {
  try {
    const { limitInt, offsetInt } = parsePagination(req.query);

    const cypher = `
      MATCH (a:Artist)
      WITH a, size((a)--()) as degree
      RETURN a, degree
      ORDER BY degree DESC
      LIMIT $limit
      OFFSET $offset
    `;

    const records = await runQuery(cypher, { limit: limitInt, offset: offsetInt });

    const results = records.map((rec) => ({
      artist: toArtist(rec.get('a')),
      degree: toNumber(rec.get('degree')),
    }));

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/top-genres
router.get('/top-genres', async (req, res, next) => {
  try {
    const { limitInt, offsetInt } = parsePagination(req.query);

    const cypher = `
      MATCH (:Artist)-[:ASSOCIATED_WITH_GENRE]->(g:Genre)
      WITH g, count(*) as count
      RETURN g.name as name, count
      ORDER BY count DESC
      LIMIT $limit
      OFFSET $offset
    `;

    const records = await runQuery(cypher, { limit: limitInt, offset: offsetInt });

    const results = records.map((rec) => ({
      name: rec.get('name'),
      count: toNumber(rec.get('count')),
    }));

    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
