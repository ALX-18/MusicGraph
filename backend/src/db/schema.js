// Applique les contraintes d'unicité du contrat (docs/CONTRACT.md) au démarrage.
// Idempotent grâce à IF NOT EXISTS : sans effet si déjà créées.
import { runQuery } from './neo4j.js';

const CONSTRAINTS = [
  'CREATE CONSTRAINT artist_mbid IF NOT EXISTS FOR (a:Artist) REQUIRE a.mbid IS UNIQUE',
  'CREATE CONSTRAINT recording_mbid IF NOT EXISTS FOR (r:Recording) REQUIRE r.mbid IS UNIQUE',
  'CREATE CONSTRAINT release_mbid IF NOT EXISTS FOR (r:Release) REQUIRE r.mbid IS UNIQUE',
  'CREATE CONSTRAINT label_mbid IF NOT EXISTS FOR (l:Label) REQUIRE l.mbid IS UNIQUE',
  'CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE',
  'CREATE CONSTRAINT area_mbid IF NOT EXISTS FOR (a:Area) REQUIRE a.mbid IS UNIQUE',
];

export async function applyConstraints() {
  for (const stmt of CONSTRAINTS) {
    // write:true car CREATE CONSTRAINT est une opération d'écriture de schéma.
    await runQuery(stmt, {}, { write: true });
  }
  console.log(`[schema] ${CONSTRAINTS.length} contraintes d'unicité appliquées`);
}
