// STUB — À IMPLÉMENTER PAR JOSUÉ (import MusicBrainz -> Neo4j).
// Importe un artiste (et ses recordings/releases/relations) depuis MusicBrainz.
//
// Contrat (docs/CONTRACT.md) :
//   POST /api/import/artists  body { mbid }  ->  { imported: Artist, counts }
//
// Helpers réutilisables :
//   import { runQuery } from '../db/neo4j.js';   // exécute du Cypher paramétré
//   import { toArtist } from '../utils/mappers.js';
// Pour écrire : runQuery(cypher, params, { write: true }).
// Respecte les contraintes d'unicité : utilise MERGE (a:Artist { mbid }) puis SET.
import { Router } from 'express';

const router = Router();

// POST /api/import/artists  body { mbid }
router.post('/artists', (req, res) => {
  // TODO(Josué): valider req.body.mbid, fetch MusicBrainz, MERGE des nœuds + relations
  // (PERFORMED, FEATURED_ON, COLLABORATED_WITH, APPEARS_ON, ...), renvoyer
  // { imported: toArtist(...), counts: { recordings, releases, collaborations } }.
  res.status(501).json({ error: 'Not Implemented — /api/import/artists (Josué)' });
});

export default router;
