// Singleton du driver Neo4j + helpers de requête.
// Toute la communication avec la base passe par ici.
import neo4j from 'neo4j-driver';

const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'musicgraph123';

let driver = null;

/** Retourne le singleton driver (le crée au premier appel). */
export function getDriver() {
  if (!driver) {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD), {
      // Garde les entiers en Integer Neo4j ; on convertit nous-mêmes dans les mappers.
      disableLosslessIntegers: false,
      maxConnectionPoolSize: 50,
    });
  }
  return driver;
}

/**
 * Attend que Neo4j soit prêt (Docker met quelques secondes à démarrer).
 * Réessaie `retries` fois avec `delayMs` entre chaque tentative.
 */
export async function waitForNeo4j(retries = 15, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await getDriver().verifyConnectivity();
      console.log(`[neo4j] connecté à ${URI}`);
      return;
    } catch (err) {
      console.log(
        `[neo4j] pas encore prêt (tentative ${attempt}/${retries}) : ${err.code || err.message}`
      );
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/**
 * Exécute une requête Cypher PARAMÉTRÉE et renvoie les records bruts.
 * @param {string} cypher
 * @param {object} params
 * @param {{ write?: boolean }} [opts] — session d'écriture si write=true
 * @returns {Promise<import('neo4j-driver').Record[]>}
 */
export async function runQuery(cypher, params = {}, opts = {}) {
  const session = getDriver().session({
    defaultAccessMode: opts.write ? neo4j.session.WRITE : neo4j.session.READ,
  });
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

/** Ferme proprement le driver (appelé au shutdown). */
export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('[neo4j] driver fermé');
  }
}
