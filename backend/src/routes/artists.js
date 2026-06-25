// Routes de lecture pour les artistes.
import { Router } from 'express';
import { runQuery } from '../db/neo4j.js';
import { toArtist, toRecording, toRelease } from '../utils/mappers.js';
import { parsePagination } from '../utils/pagination.js';

const router = Router();

// GET /api/artists — liste paginée
router.get('/', async (req, res, next) => {
  try {
    const { limitInt, offsetInt } = parsePagination(req.query);
    const records = await runQuery(
      `MATCH (a:Artist)
       RETURN a
       ORDER BY a.name
       SKIP $offset LIMIT $limit`,
      { offset: offsetInt, limit: limitInt }
    );
    res.json(records.map((r) => toArtist(r.get('a'))));
  } catch (err) {
    next(err);
  }
});

// GET /api/artists/:id — un artiste par mbid (404 si introuvable)
router.get('/:id', async (req, res, next) => {
  try {
    const records = await runQuery(
      `MATCH (a:Artist { mbid: $mbid }) RETURN a`,
      { mbid: req.params.id }
    );
    if (records.length === 0) {
      return res.status(404).json({ error: `Artist ${req.params.id} introuvable` });
    }
    res.json(toArtist(records[0].get('a')));
  } catch (err) {
    next(err);
  }
});

// GET /api/artists/:id/recordings
router.get('/:id/recordings', async (req, res, next) => {
  try {
    const { limitInt, offsetInt } = parsePagination(req.query);
    const records = await runQuery(
      `MATCH (a:Artist { mbid: $mbid })-[:PERFORMED|FEATURED_ON]->(r:Recording)
       RETURN DISTINCT r
       ORDER BY r.title
       SKIP $offset LIMIT $limit`,
      { mbid: req.params.id, offset: offsetInt, limit: limitInt }
    );
    res.json(records.map((rec) => toRecording(rec.get('r'))));
  } catch (err) {
    next(err);
  }
});

// GET /api/artists/:id/releases
router.get('/:id/releases', async (req, res, next) => {
  try {
    const { limitInt, offsetInt } = parsePagination(req.query);
    const records = await runQuery(
      `MATCH (a:Artist { mbid: $mbid })-[:PERFORMED|FEATURED_ON]->(:Recording)-[:APPEARS_ON]->(rel:Release)
       RETURN DISTINCT rel
       ORDER BY rel.date
       SKIP $offset LIMIT $limit`,
      { mbid: req.params.id, offset: offsetInt, limit: limitInt }
    );
    res.json(records.map((rec) => toRelease(rec.get('rel'))));
  } catch (err) {
    next(err);
  }
});

// GET /api/artists/:id/collaborations — [{ artist, weight }]
router.get('/:id/collaborations', async (req, res, next) => {
  try {
    const { limitInt, offsetInt } = parsePagination(req.query);
    const records = await runQuery(
      `MATCH (a:Artist { mbid: $mbid })-[c:COLLABORATED_WITH]-(other:Artist)
       RETURN other, c.weight AS weight
       ORDER BY weight DESC
       SKIP $offset LIMIT $limit`,
      { mbid: req.params.id, offset: offsetInt, limit: limitInt }
    );
    res.json(
      records.map((rec) => ({
        artist: toArtist(rec.get('other')),
        weight: rec.get('weight')?.toNumber?.() ?? rec.get('weight') ?? null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
