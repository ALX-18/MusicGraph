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
import { searchArtist } from '../services/musicbrainz.js';

const router = Router();

// GET /api/search/artists?q=
router.get('/artists', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Paramètre "q" obligatoire (min 1 char)' });
    }

    const results = await searchArtist(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
