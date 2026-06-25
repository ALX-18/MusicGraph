// Routes "graphe" : renvoient { nodes, links } prêts à dessiner côté frontend.
import { Router } from 'express';
import neo4j from 'neo4j-driver';
import { runQuery } from '../db/neo4j.js';
import { toGraphNode } from '../utils/mappers.js';
import { parsePagination } from '../utils/pagination.js';

const router = Router();

/**
 * Construit { nodes, links } à partir de records (a, r, b).
 * Déduplique les nœuds par id (mbid) et les liens par (source,target,type).
 */
function buildGraph(records) {
  const nodes = new Map();
  const links = new Map();

  const addNode = (node) => {
    if (!node) return;
    const gn = toGraphNode(node);
    if (!nodes.has(gn.id)) nodes.set(gn.id, gn);
  };

  for (const rec of records) {
    const a = rec.get('a');
    const b = rec.get('b');
    const r = rec.get('r');
    addNode(a);
    addNode(b);
    if (r && a && b) {
      const source = a.properties.mbid;
      const target = b.properties.mbid;
      const type = r.type;
      const key = `${source}|${target}|${type}`;
      if (!links.has(key)) {
        const link = { source, target, type };
        const w = r.properties?.weight;
        if (w !== undefined && w !== null) {
          link.weight = neo4j.isInt(w) ? w.toNumber() : w;
        }
        links.set(key, link);
      }
    }
  }

  return { nodes: [...nodes.values()], links: [...links.values()] };
}

// GET /api/graph — graphe global (Artist/Recording/Release + relations), borné par limit
router.get('/', async (req, res, next) => {
  try {
    const { limitInt } = parsePagination(req.query);
    const records = await runQuery(
      `MATCH (a)-[r]->(b)
       WHERE (a:Artist OR a:Recording OR a:Release)
         AND (b:Artist OR b:Recording OR b:Release)
       RETURN a, r, b
       LIMIT $limit`,
      { limit: limitInt }
    );
    res.json(buildGraph(records));
  } catch (err) {
    next(err);
  }
});

// GET /api/graph/artists/:id — voisinage : l'artiste, ses recordings, et les artistes liés
router.get('/artists/:id', async (req, res, next) => {
  try {
    // On vérifie d'abord l'existence pour renvoyer un vrai 404.
    const exists = await runQuery(
      `MATCH (a:Artist { mbid: $mbid }) RETURN a`,
      { mbid: req.params.id }
    );
    if (exists.length === 0) {
      return res.status(404).json({ error: `Artist ${req.params.id} introuvable` });
    }
    const records = await runQuery(
      `MATCH (a:Artist { mbid: $mbid })-[r]-(b)
       WHERE (b:Artist OR b:Recording OR b:Release)
       RETURN a, r, b`,
      { mbid: req.params.id }
    );
    res.json(buildGraph(records));
  } catch (err) {
    next(err);
  }
});

// GET /api/graph/collaborations — sous-graphe des artistes reliés par COLLABORATED_WITH
router.get('/collaborations', async (req, res, next) => {
  try {
    const { limitInt } = parsePagination(req.query);
    const records = await runQuery(
      `MATCH (a:Artist)-[r:COLLABORATED_WITH]->(b:Artist)
       RETURN a, r, b
       LIMIT $limit`,
      { limit: limitInt }
    );
    res.json(buildGraph(records));
  } catch (err) {
    next(err);
  }
});

export default router;
