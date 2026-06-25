// Seed minimal pour tester l'API AVANT l'import MusicBrainz de Josué.
// Données 100% factices (mbid bidons "seed-...") mais conformes au modèle du contrat.
//
// Chargement (voir docs/BACKEND.md) :
//   docker exec -i musicgraph-neo4j cypher-shell -u neo4j -p musicgraph123 < backend/scripts/seed.cypher
// ou copier/coller dans le Neo4j Browser (http://localhost:7474).

// Idempotent : on nettoie d'abord les nœuds de seed.
MATCH (n) WHERE n.mbid STARTS WITH 'seed-' DETACH DELETE n;
MATCH (g:Genre) WHERE g.name IN ['rock','electronic','hip-hop'] DETACH DELETE g;

// --- Areas ---
MERGE (uk:Area { mbid: 'seed-area-uk' }) SET uk.name = 'United Kingdom', uk.type = 'Country';
MERGE (us:Area { mbid: 'seed-area-us' }) SET us.name = 'United States', us.type = 'Country';

// --- Genres ---
MERGE (:Genre { name: 'rock' });
MERGE (:Genre { name: 'electronic' });
MERGE (:Genre { name: 'hip-hop' });

// --- Labels ---
MERGE (lbl1:Label { mbid: 'seed-label-1' }) SET lbl1.name = 'Northern Records', lbl1.country = 'GB';
MERGE (lbl2:Label { mbid: 'seed-label-2' }) SET lbl2.name = 'Coastline Music', lbl2.country = 'US';

// --- Artists ---
MERGE (a1:Artist { mbid: 'seed-artist-1' })
  SET a1.name = 'The Aurora', a1.type = 'Group', a1.country = 'GB',
      a1.gender = null, a1.beginDate = '2005', a1.endDate = null,
      a1.disambiguation = 'British rock band';
MERGE (a2:Artist { mbid: 'seed-artist-2' })
  SET a2.name = 'Mona Reyes', a2.type = 'Person', a2.country = 'US',
      a2.gender = 'Female', a2.beginDate = '1988', a2.endDate = null,
      a2.disambiguation = 'electronic producer';
MERGE (a3:Artist { mbid: 'seed-artist-3' })
  SET a3.name = 'DJ Cipher', a3.type = 'Person', a3.country = 'US',
      a3.gender = 'Male', a3.beginDate = '1990', a3.endDate = null,
      a3.disambiguation = null;            // country/gender volontairement variés (données manquantes tolérées)
MERGE (a4:Artist { mbid: 'seed-artist-4' })
  SET a4.name = 'Lone Pioneer', a4.type = 'Person', a4.country = null,
      a4.gender = null, a4.beginDate = null, a4.endDate = null,
      a4.disambiguation = null;            // artiste quasi vide : ne doit pas casser l'API

// --- Recordings ---
MERGE (r1:Recording { mbid: 'seed-rec-1' })
  SET r1.title = 'Midnight Signal', r1.length = 217000, r1.firstReleaseDate = '2018-03-01',
      r1.popularity = 87, r1.source = 'seed';
MERGE (r2:Recording { mbid: 'seed-rec-2' })
  SET r2.title = 'Neon Tide', r2.length = 195000, r2.firstReleaseDate = '2020-06-15',
      r2.popularity = 72, r2.source = 'seed';
MERGE (r3:Recording { mbid: 'seed-rec-3' })
  SET r3.title = 'City Cipher', r3.length = 240000, r3.firstReleaseDate = '2021-11-05',
      r3.popularity = 64, r3.source = 'seed';

// --- Releases ---
MERGE (rel1:Release { mbid: 'seed-release-1' })
  SET rel1.title = 'Aurora Rising', rel1.date = '2018-04-01', rel1.country = 'GB',
      rel1.status = 'Official', rel1.releaseType = 'Album';
MERGE (rel2:Release { mbid: 'seed-release-2' })
  SET rel2.title = 'Tidal', rel2.date = '2020-07-01', rel2.country = 'US',
      rel2.status = 'Official', rel2.releaseType = 'Album';

// --- Relations : Artist -> Recording ---
MATCH (a1:Artist { mbid: 'seed-artist-1' }), (r1:Recording { mbid: 'seed-rec-1' })
  MERGE (a1)-[:PERFORMED]->(r1);
MATCH (a2:Artist { mbid: 'seed-artist-2' }), (r2:Recording { mbid: 'seed-rec-2' })
  MERGE (a2)-[:PERFORMED]->(r2);
MATCH (a2:Artist { mbid: 'seed-artist-2' }), (r3:Recording { mbid: 'seed-rec-3' })
  MERGE (a2)-[:PERFORMED]->(r3);
MATCH (a3:Artist { mbid: 'seed-artist-3' }), (r3:Recording { mbid: 'seed-rec-3' })
  MERGE (a3)-[:FEATURED_ON]->(r3);
MATCH (a1:Artist { mbid: 'seed-artist-1' }), (r2:Recording { mbid: 'seed-rec-2' })
  MERGE (a1)-[:FEATURED_ON]->(r2);

// --- Relations : Recording -> Release ---
MATCH (r1:Recording { mbid: 'seed-rec-1' }), (rel1:Release { mbid: 'seed-release-1' })
  MERGE (r1)-[:APPEARS_ON]->(rel1);
MATCH (r2:Recording { mbid: 'seed-rec-2' }), (rel2:Release { mbid: 'seed-release-2' })
  MERGE (r2)-[:APPEARS_ON]->(rel2);
MATCH (r3:Recording { mbid: 'seed-rec-3' }), (rel2:Release { mbid: 'seed-release-2' })
  MERGE (r3)-[:APPEARS_ON]->(rel2);

// --- Relations : Release -> Label / Area ---
MATCH (rel1:Release { mbid: 'seed-release-1' }), (lbl1:Label { mbid: 'seed-label-1' })
  MERGE (rel1)-[:RELEASED_BY]->(lbl1);
MATCH (rel2:Release { mbid: 'seed-release-2' }), (lbl2:Label { mbid: 'seed-label-2' })
  MERGE (rel2)-[:RELEASED_BY]->(lbl2);
MATCH (rel1:Release { mbid: 'seed-release-1' }), (uk:Area { mbid: 'seed-area-uk' })
  MERGE (rel1)-[:RELEASED_IN]->(uk);
MATCH (rel2:Release { mbid: 'seed-release-2' }), (us:Area { mbid: 'seed-area-us' })
  MERGE (rel2)-[:RELEASED_IN]->(us);

// --- Relations : Artist -> Genre / Area ---
MATCH (a1:Artist { mbid: 'seed-artist-1' }), (g:Genre { name: 'rock' })
  MERGE (a1)-[:ASSOCIATED_WITH_GENRE]->(g);
MATCH (a2:Artist { mbid: 'seed-artist-2' }), (g:Genre { name: 'electronic' })
  MERGE (a2)-[:ASSOCIATED_WITH_GENRE]->(g);
MATCH (a3:Artist { mbid: 'seed-artist-3' }), (g:Genre { name: 'hip-hop' })
  MERGE (a3)-[:ASSOCIATED_WITH_GENRE]->(g);
MATCH (a1:Artist { mbid: 'seed-artist-1' }), (uk:Area { mbid: 'seed-area-uk' })
  MERGE (a1)-[:FROM_AREA]->(uk);
MATCH (a2:Artist { mbid: 'seed-artist-2' }), (us:Area { mbid: 'seed-area-us' })
  MERGE (a2)-[:FROM_AREA]->(us);

// --- Relations : COLLABORATED_WITH (avec weight) ---
MATCH (a1:Artist { mbid: 'seed-artist-1' }), (a2:Artist { mbid: 'seed-artist-2' })
  MERGE (a1)-[c:COLLABORATED_WITH]->(a2) SET c.weight = 3;
MATCH (a2:Artist { mbid: 'seed-artist-2' }), (a3:Artist { mbid: 'seed-artist-3' })
  MERGE (a2)-[c:COLLABORATED_WITH]->(a3) SET c.weight = 5;
MATCH (a1:Artist { mbid: 'seed-artist-1' }), (a3:Artist { mbid: 'seed-artist-3' })
  MERGE (a1)-[c:COLLABORATED_WITH]->(a3) SET c.weight = 1;
