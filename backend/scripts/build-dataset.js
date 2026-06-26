#!/usr/bin/env node
// Build dataset : import 10 artistes seed depuis MusicBrainz -> Neo4j, puis export JSON.
// Utilisation : node scripts/build-dataset.js

import dotenv from 'dotenv';
import { getDriver, waitForNeo4j, runQuery, closeDriver } from '../src/db/neo4j.js';
import { toArtist } from '../src/utils/mappers.js';
import {
  searchArtist,
  getArtist,
  getArtistRecordings,
  getReleasesForRecording,
} from '../src/services/musicbrainz.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');

// Noms des artistes seed — MBIDs résolus via searchArtist au runtime pour éviter les 404.
const SEED_ARTISTS = [
  { name: 'Daft Punk' },
  { name: 'Stromae' },
  { name: 'Angèle' },
  { name: 'PNL' },
  { name: 'Damso' },
  { name: 'SCH' },
  { name: 'Ninho' },
  { name: 'Kendrick Lamar' },
  { name: 'Jay-Z' },
  { name: 'Beyoncé' },
];

async function resolveMbid(name) {
  const results = await searchArtist(name);
  if (!results || results.length === 0) throw new Error(`Aucun résultat MB pour "${name}"`);
  const top = results[0];
  console.log(`  → ${name} → MBID ${top.mbid} (score=${top.score})`);
  return top.mbid;
}

async function main() {
  try {
    console.log('[dataset] Attendre Neo4j...');
    await waitForNeo4j();

    console.log('[dataset] Importer artistes seed...');
    const importedArtists = [];
    let totalRecordings = 0;
    let totalReleases = 0;
    let totalCollabs = 0;

    for (const seedArtist of SEED_ARTISTS) {
      try {
        console.log(`  → Résoudre MBID : ${seedArtist.name}...`);
        const mbid = await resolveMbid(seedArtist.name);
        seedArtist.mbid = mbid;

        console.log(`  → Importer ${seedArtist.name} (${seedArtist.mbid})...`);

        const artistData = await getArtist(seedArtist.mbid);

        // MERGE Artist
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

        const imported = toArtist(artistRecords[0].get('a'));

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
        importedArtists.push(imported);

        // Fetch recordings (limit 50 pour seed)
        try {
          const recordings = await getArtistRecordings(seedArtist.mbid, 50);
          totalRecordings += recordings.length;

          const COLLAB_PATTERNS = /\b(feat\.|featuring|ft\.|avec|x|&)\b/i;

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

            // PERFORMED/FEATURED_ON
            const isMainArtist = rec.artistCredits.some((ac) => ac.mbid === seedArtist.mbid);
            const relationType = isMainArtist ? 'PERFORMED' : 'FEATURED_ON';

            const createRelCypher = `
              MATCH (a:Artist { mbid: $mbid }), (r:Recording { mbid: $recMbid })
              MERGE (a)-[:${relationType}]->(r)
            `;

            await runQuery(
              createRelCypher,
              { mbid: seedArtist.mbid, recMbid: rec.mbid },
              { write: true }
            );

            // Collaborations
            const collabs = new Set();
            for (const ac of rec.artistCredits) {
              if (ac.mbid && ac.mbid !== seedArtist.mbid && COLLAB_PATTERNS.test(ac.joinphrase)) {
                collabs.add(ac.mbid);

                // MERGE collab artist
                const mergeCollabCypher = `
                  MERGE (ca:Artist { mbid: $collabMbid })
                  SET ca.name = $collabName
                  RETURN ca
                `;

                await runQuery(
                  mergeCollabCypher,
                  { collabMbid: ac.mbid, collabName: ac.name },
                  { write: true }
                );

                // FEATURED_ON
                const featuredOnCypher = `
                  MATCH (ca:Artist { mbid: $collabMbid }), (r:Recording { mbid: $recMbid })
                  MERGE (ca)-[:FEATURED_ON]->(r)
                `;

                await runQuery(
                  featuredOnCypher,
                  { collabMbid: ac.mbid, recMbid: rec.mbid },
                  { write: true }
                );
              }
            }

            totalCollabs += collabs.size;

            // COLLABORATED_WITH
            for (const collabMbid of collabs) {
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
                { mbid: seedArtist.mbid, collabMbid },
                { write: true }
              );
            }

            // Fetch releases (limit 30)
            try {
              const releases = await getReleasesForRecording(rec.mbid);
              totalReleases += Math.min(releases.length, 30);

              for (let i = 0; i < Math.min(releases.length, 30); i++) {
                const rel = releases[i];

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

                // APPEARS_ON
                const appearsOnCypher = `
                  MATCH (r:Recording { mbid: $recMbid }), (rel:Release { mbid: $relMbid })
                  MERGE (r)-[:APPEARS_ON]->(rel)
                `;

                await runQuery(
                  appearsOnCypher,
                  { recMbid: rec.mbid, relMbid: rel.mbid },
                  { write: true }
                );

                // Labels
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
              }
            } catch (err) {
              console.warn(`    ! Erreur releases pour ${rec.mbid} : ${err.message}`);
            }
          }
        } catch (err) {
          console.warn(`  ! Erreur recordings pour ${seedArtist.mbid} : ${err.message}`);
        }
      } catch (err) {
        console.error(`  ✗ Erreur importer ${seedArtist.name} : ${err.message}`);
      }
    }

    console.log(`[dataset] Import terminé :`);
    console.log(`  - ${importedArtists.length} artistes`);
    console.log(`  - ${totalRecordings} recordings`);
    console.log(`  - ${totalReleases} releases`);
    console.log(`  - ${totalCollabs} collaborations`);

    // Export dataset JSON
    console.log('[dataset] Exporter JSON...');
    const dataset = {
      timestamp: new Date().toISOString(),
      summary: {
        artists: importedArtists.length,
        recordings: totalRecordings,
        releases: totalReleases,
        collaborations: totalCollabs,
      },
      artists: importedArtists,
    };

    // Créer data/ si absent
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, 'musicgraph-dataset.json');
    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
    console.log(`[dataset] Écrit ${outputPath}`);

    console.log('[dataset] ✓ Terminé');
  } catch (err) {
    console.error('[dataset] ✗ ERREUR :', err.message);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

main();
