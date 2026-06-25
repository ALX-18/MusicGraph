// Routes de lecture pour les enregistrements (recordings).
import { Router } from 'express';
import { runQuery } from '../db/neo4j.js';
import { toRecording, toArtist, toRelease } from '../utils/mappers.js';
import { parsePagination } from '../utils/pagination.js';

const router = Router();

// GET /api/recordings
router.get('/', async (req, res, next) => {
  try {
    const { limitInt, offsetInt } = parsePagination(req.query);
    const records = await runQuery(
      `MATCH (r:Recording)
       RETURN r
       ORDER BY r.title
       SKIP $offset LIMIT $limit`,
      { offset: offsetInt, limit: limitInt }
    );
    res.json(records.map((rec) => toRecording(rec.get('r'))));
  } catch (err) {
    next(err);
  }
});

// GET /api/recordings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const records = await runQuery(
      `MATCH (r:Recording { mbid: $mbid }) RETURN r`,
      { mbid: req.params.id }
    );
    if (records.length === 0) {
      return res.status(404).json({ error: `Recording ${req.params.id} introuvable` });
    }
    res.json(toRecording(records[0].get('r')));
  } catch (err) {
    next(err);
  }
});

// GET /api/recordings/:id/artists — interprètes (PERFORMED ou FEATURED_ON)
router.get('/:id/artists', async (req, res, next) => {
  try {
    const records = await runQuery(
      `MATCH (a:Artist)-[:PERFORMED|FEATURED_ON]->(r:Recording { mbid: $mbid })
       RETURN DISTINCT a
       ORDER BY a.name`,
      { mbid: req.params.id }
    );
    res.json(records.map((rec) => toArtist(rec.get('a'))));
  } catch (err) {
    next(err);
  }
});

// GET /api/recordings/:id/releases
router.get('/:id/releases', async (req, res, next) => {
  try {
    const records = await runQuery(
      `MATCH (r:Recording { mbid: $mbid })-[:APPEARS_ON]->(rel:Release)
       RETURN DISTINCT rel
       ORDER BY rel.date`,
      { mbid: req.params.id }
    );
    res.json(records.map((rec) => toRelease(rec.get('rel'))));
  } catch (err) {
    next(err);
  }
});

export default router;
