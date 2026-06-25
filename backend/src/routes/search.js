// STUB — À IMPLÉMENTER PAR JOSUÉ (client MusicBrainz).
// Recherche d'artistes via l'API MusicBrainz, résultats NON stockés en base.
//
// Contrat (docs/CONTRACT.md) :
//   GET /api/search/artists?q=  ->  ArtistSearchResult[]
//   type ArtistSearchResult = { mbid, name, country, type, beginDate, score }
//
// Helpers réutilisables déjà dispos : aucun appel DB ici (résultats à la volée).
// Utilise process.env.MUSICBRAINZ_BASE_URL et MUSICBRAINZ_USER_AGENT (User-Agent OBLIGATOIRE).
import { Router } from 'express';

const router = Router();

// GET /api/search/artists?q=
router.get('/artists', (req, res) => {
  // TODO(Josué): appeler MusicBrainz /ws/2/artist?query=...&fmt=json,
  // mapper vers ArtistSearchResult[], gérer le rate-limit (1 req/s) et le User-Agent.
  res.status(501).json({ error: 'Not Implemented — /api/search/artists (Josué)' });
});

export default router;
