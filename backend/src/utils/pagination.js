// Parsing robuste des paramètres de pagination ?limit=&offset=.
// Valeurs par défaut : limit=50, offset=0. Bornage pour éviter les abus.
import neo4j from 'neo4j-driver';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

/**
 * Lit limit/offset depuis req.query, valide, et renvoie des Integer Neo4j
 * (SKIP/LIMIT en Cypher exigent des entiers, pas des floats JS).
 * @throws {Error} avec status 400 si une valeur est invalide.
 */
export function parsePagination(query = {}) {
  let limit = DEFAULT_LIMIT;
  let offset = 0;

  if (query.limit !== undefined) {
    const n = Number(query.limit);
    if (!Number.isInteger(n) || n < 1) {
      const e = new Error('Paramètre "limit" invalide (entier >= 1 attendu)');
      e.status = 400;
      throw e;
    }
    limit = Math.min(n, MAX_LIMIT);
  }

  if (query.offset !== undefined) {
    const n = Number(query.offset);
    if (!Number.isInteger(n) || n < 0) {
      const e = new Error('Paramètre "offset" invalide (entier >= 0 attendu)');
      e.status = 400;
      throw e;
    }
    offset = n;
  }

  return {
    limit,
    offset,
    // Versions Integer Neo4j à passer directement en params Cypher.
    limitInt: neo4j.int(limit),
    offsetInt: neo4j.int(offset),
  };
}
