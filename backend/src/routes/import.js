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
import { runQuery } from '../db/neo4j.js';
import { toArtist } from '../utils/mappers.js';
import { getArtist, getArtistRecordings, getReleasesForRecording } from '../services/musicbrainz.js';

const router = Router();

// Regex pour détecter les collaborations dans les titres ou artist-credits
const COLLAB_PATTERNS = /\b(feat\.|featuring|ft\.|avec|x|&)\b/i;

// Extrait les MBID d'artistes d'une liste de artist-credits, avec détection de collaborations
function extractCollaborators(artistCredits, mainArtistMbid) {
  const collabs = new Set();

  for (const ac of artistCredits) {
    if (ac.mbid && ac.mbid !== mainArtistMbid) {
      // Détecte si joinphrase contient une collaboration (feat, ft, avec, x, &)
      if (COLLAB_PATTERNS.test(ac.joinphrase)) {
        collabs.add(ac.mbid);
      }
    }
  }

  return Array.from(collabs);
}

// POST /api/import/artists  body { mbid }
router.post('/artists', async (req, res, next) => {
  try {
    const { mbid } = req.body;

    if (!mbid || mbid.trim().length === 0) {
      return res.status(400).json({ error: 'Paramètre "mbid" obligatoire' });
    }

    // 1. Fetch artist depuis MusicBrainz
    console.log(`[import] Fetching artiste ${mbid} from MusicBrainz...`);
    const artistData = await getArtist(mbid);

    // 2. MERGE Artist
    console.log(`[import] MERGE Artist ${mbid}...`);
    const mergeArtistCypher = `
      MERGE (a:Artist { mbid: $mbid })
      SET a.name = $name,
          a.type = $type,
          a.country = $country,
          a.gender = $gender,
          a.beginDate = $beginDate,
          a.endDate = $endDate,
          a.disambiguation = $disambiguation
      RETURN a
    `;

    const artistRecords = await runQuery(
      mergeArtistCypher,
      {
        mbid: artistData.mbid,
        name: artistData.name,
        type: artistData.type,
        country: artistData.country,
        gender: artistData.gender,
        beginDate: artistData.beginDate,
        endDate: artistData.endDate,
        disambiguation: artistData.disambiguation,
      },
      { write: true }
    );

    const importedArtist = toArtist(artistRecords[0].get('a'));

    // Clean genres
    await runQuery(
      `MATCH (a:Artist { mbid: $mbid })
       OPTIONAL MATCH (a)-[r:ASSOCIATED_WITH_GENRE]->()
       DELETE r`,
      { mbid: artistData.mbid },
      { write: true }
    );

    // Merge genres if any
    const genres = artistData.genres || [];
    if (genres.length > 0) {
      await runQuery(
        `MATCH (a:Artist { mbid: $mbid })
         UNWIND $genres as genreName
         MERGE (g:Genre { name: genreName })
         MERGE (a)-[:ASSOCIATED_WITH_GENRE]->(g)`,
        { mbid: artistData.mbid, genres },
        { write: true }
      );
    }

    // Clean area
    await runQuery(
      `MATCH (a:Artist { mbid: $mbid })
       OPTIONAL MATCH (a)-[r:FROM_AREA]->()
       DELETE r`,
      { mbid: artistData.mbid },
      { write: true }
    );

    // Merge area if exists
    if (artistData.area?.mbid && artistData.area?.name) {
      await runQuery(
        `MATCH (a:Artist { mbid: $mbid })
         MERGE (ar:Area { mbid: $areaMbid })
         SET ar.name = $areaName, ar.type = $areaType
         MERGE (a)-[:FROM_AREA]->(ar)`,
        {
          mbid: artistData.mbid,
          areaMbid: artistData.area.mbid,
          areaName: artistData.area.name,
          areaType: artistData.area.type || null,
        },
        { write: true }
      );
    }

    // 3. Fetch recordings + create Recording nodes + relations
    console.log(`[import] Fetching recordings pour ${mbid}...`);
    let recordingCount = 0;
    let releaseCount = 0;
    let collaborationCount = 0;
    const collaborators = new Set(); // Track all collabs pour weight increment

    const recordings = await getArtistRecordings(mbid, 100);

    for (const rec of recordings) {
      // MERGE Recording
      const mergeRecordingCypher = `
        MERGE (r:Recording { mbid: $recMbid })
        SET r.title = $recTitle, r.length = $recLength, r.firstReleaseDate = $recFirstReleaseDate,
            r.popularity = 50, r.source = 'musicbrainz'
        RETURN r
      `;

      await runQuery(
        mergeRecordingCypher,
        {
          recMbid: rec.mbid,
          recTitle: rec.title,
          recLength: rec.length,
          recFirstReleaseDate: rec.firstReleaseDate,
        },
        { write: true }
      );

      recordingCount++;

      // Créer relations PERFORMED/FEATURED_ON avec l'artiste principal
      const isMainArtist = rec.artistCredits.some((ac) => ac.mbid === mbid);
      const relationType = isMainArtist ? 'PERFORMED' : 'FEATURED_ON';

      const createRelCypher = `
        MATCH (a:Artist { mbid: $mbid }), (r:Recording { mbid: $recMbid })
        MERGE (a)-[:${relationType}]->(r)
      `;

      await runQuery(
        createRelCypher,
        { mbid, recMbid: rec.mbid },
        { write: true }
      );

      // Détection des collaborations
      const collabs = extractCollaborators(rec.artistCredits, mbid);
      for (const collabMbid of collabs) {
        collaborators.add(collabMbid);

        // MERGE collab artist si n'existe pas
        const mergeCollabArtistCypher = `
          MERGE (ca:Artist { mbid: $collabMbid })
          SET ca.name = $collabName
          RETURN ca
        `;

        const collabAC = rec.artistCredits.find((ac) => ac.mbid === collabMbid);
        await runQuery(
          mergeCollabArtistCypher,
          { collabMbid, collabName: collabAC?.name || collabMbid },
          { write: true }
        );

        // MERGE FEATURED_ON relation (collab artist -> recording)
        const createFeaturedOnCypher = `
          MATCH (ca:Artist { mbid: $collabMbid }), (r:Recording { mbid: $recMbid })
          MERGE (ca)-[:FEATURED_ON]->(r)
        `;

        await runQuery(
          createFeaturedOnCypher,
          { collabMbid, recMbid: rec.mbid },
          { write: true }
        );
      }

      // 4. Fetch releases pour ce recording
      console.log(`[import]   Fetching releases for recording ${rec.mbid}...`);
      try {
        const releases = await getReleasesForRecording(rec.mbid);

        for (const rel of releases) {
          // MERGE Release
          const mergeReleaseCypher = `
            MERGE (rel:Release { mbid: $relMbid })
            SET rel.title = $relTitle, rel.date = $relDate, rel.country = $relCountry,
                rel.status = $relStatus, rel.releaseType = $relReleaseType
            RETURN rel
          `;

          await runQuery(
            mergeReleaseCypher,
            {
              relMbid: rel.mbid,
              relTitle: rel.title,
              relDate: rel.date,
              relCountry: rel.country,
              relStatus: rel.status,
              relReleaseType: rel.releaseType,
            },
            { write: true }
          );

          releaseCount++;

          // APPEARS_ON (recording -> release)
          const appearsOnCypher = `
            MATCH (r:Recording { mbid: $recMbid }), (rel:Release { mbid: $relMbid })
            MERGE (r)-[:APPEARS_ON]->(rel)
          `;

          await runQuery(
            appearsOnCypher,
            { recMbid: rec.mbid, relMbid: rel.mbid },
            { write: true }
          );

          // RELEASED_BY (release -> label) + area labels
          for (const label of rel.labels) {
            if (label.mbid) {
              const mergeAndReleaseByCypher = `
                MERGE (l:Label { mbid: $labelMbid })
                SET l.name = $labelName, l.country = $labelCountry
                WITH l
                MATCH (rel:Release { mbid: $relMbid })
                MERGE (rel)-[:RELEASED_BY]->(l)
              `;

              await runQuery(
                mergeAndReleaseByCypher,
                {
                  labelMbid: label.mbid,
                  labelName: label.name,
                  labelCountry: label.country,
                  relMbid: rel.mbid,
                },
                { write: true }
              );
            }
          }

          // RELEASED_IN (release -> area)
          if (rel.area) {
            const releasedInCypher = `
              MERGE (ar:Area { mbid: $areaMbid })
              SET ar.name = $areaName, ar.type = 'Country'
              WITH ar
              MATCH (rel:Release { mbid: $relMbid })
              MERGE (rel)-[:RELEASED_IN]->(ar)
            `;

            await runQuery(
              releasedInCypher,
              {
                areaMbid: rel.area,
                areaName: rel.area,
                relMbid: rel.mbid,
              },
              { write: true }
            );
          }
        }
      } catch (err) {
        console.warn(`[import] Erreur fetching releases pour ${rec.mbid} : ${err.message}`);
      }
    }

    // 5. Créer/incrémenter COLLABORATED_WITH relations
    for (const collabMbid of collaborators) {
      collaborationCount++;
      const createCollabCypher = `
        MATCH (a:Artist { mbid: $mbid }), (ca:Artist { mbid: $collabMbid })
        WITH a, ca,
             CASE WHEN a.mbid < ca.mbid THEN a ELSE ca END as first,
             CASE WHEN a.mbid < ca.mbid THEN ca ELSE a END as second
        MERGE (first)-[c:COLLABORATED_WITH]->(second)
        SET c.weight = coalesce(c.weight, 0) + 1
      `;

      await runQuery(
        createCollabCypher,
        { mbid, collabMbid },
        { write: true }
      );
    }

    console.log(`[import] Import complet : ${recordingCount} recordings, ${releaseCount} releases, ${collaborationCount} collabs`);

    res.json({
      imported: importedArtist,
      counts: {
        recordings: recordingCount,
        releases: releaseCount,
        collaborations: collaborationCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
