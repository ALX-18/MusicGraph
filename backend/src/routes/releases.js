// Routes de lecture pour les sorties (releases).
import { Router } from 'express';
import { runQuery } from '../db/neo4j.js';
import { toRelease, toRecording, toArtist } from '../utils/mappers.js';
import { parsePagination } from '../utils/pagination.js';

const router = Router();

// GET /api/releases
router.get('/', async (req, res, next) => {
  try {
    const { limitInt, offsetInt } = parsePagination(req.query);
    const records = await runQuery(
      `MATCH (rel:Release)
       RETURN rel
       ORDER BY rel.date
       SKIP $offset LIMIT $limit`,
      { offset: offsetInt, limit: limitInt }
    );
    res.json(records.map((rec) => toRelease(rec.get('rel'))));
  } catch (err) {
    next(err);
  }
});

// GET /api/releases/:id
router.get('/:id', async (req, res, next) => {
  try {
    const records = await runQuery(
      `MATCH (rel:Release { mbid: $mbid }) RETURN rel`,
      { mbid: req.params.id }
    );
    if (records.length === 0) {
      return res.status(404).json({ error: `Release ${req.params.id} introuvable` });
    }
    res.json(toRelease(records[0].get('rel')));
  } catch (err) {
    next(err);
  }
});

// GET /api/releases/:id/recordings
router.get('/:id/recordings', async (req, res, next) => {
  try {
    const records = await runQuery(
      `MATCH (r:Recording)-[:APPEARS_ON]->(rel:Release { mbid: $mbid })
       RETURN DISTINCT r
       ORDER BY r.title`,
      { mbid: req.params.id }
    );
    res.json(records.map((rec) => toRecording(rec.get('r'))));
  } catch (err) {
    next(err);
  }
});

// GET /api/releases/:id/artists — artistes présents sur la sortie
router.get('/:id/artists', async (req, res, next) => {
  try {
    const records = await runQuery(
      `MATCH (a:Artist)-[:PERFORMED|FEATURED_ON]->(:Recording)-[:APPEARS_ON]->(rel:Release { mbid: $mbid })
       RETURN DISTINCT a
       ORDER BY a.name`,
      { mbid: req.params.id }
    );
    res.json(records.map((rec) => toArtist(rec.get('a'))));
  } catch (err) {
    next(err);
  }
});

export default router;
