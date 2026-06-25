// Conversion des records Neo4j vers les formats JSON du contrat (docs/CONTRACT.md).
// Point clé : Neo4j renvoie des Integer (objet { low, high }) qu'il faut convertir
// en Number JS, sinon le JSON est illisible pour le frontend.
import neo4j from 'neo4j-driver';

/** Convertit un Integer Neo4j en Number JS ; laisse passer les autres valeurs. */
export function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (neo4j.isInt(value)) return value.toNumber();
  return value;
}

/**
 * Normalise les propriétés d'un nœud : tout Integer -> Number.
 * Les champs absents restent `null` (données manquantes tolérées).
 */
function normalizeProps(props = {}) {
  const out = {};
  for (const [key, val] of Object.entries(props)) {
    out[key] = neo4j.isInt(val) ? val.toNumber() : val;
  }
  return out;
}

const pick = (props, keys) => {
  const p = normalizeProps(props);
  const out = {};
  for (const k of keys) out[k] = p[k] ?? null;
  return out;
};

const ARTIST_KEYS = ['mbid', 'name', 'type', 'country', 'gender', 'beginDate', 'endDate', 'disambiguation'];
const RECORDING_KEYS = ['mbid', 'title', 'length', 'firstReleaseDate', 'popularity', 'source'];
const RELEASE_KEYS = ['mbid', 'title', 'date', 'country', 'status', 'releaseType'];

export const toArtist = (node) => (node ? pick(node.properties, ARTIST_KEYS) : null);
export const toRecording = (node) => (node ? pick(node.properties, RECORDING_KEYS) : null);
export const toRelease = (node) => (node ? pick(node.properties, RELEASE_KEYS) : null);

/**
 * Mappe un nœud Neo4j vers un GraphNode du contrat :
 * { id, label, type, ...props }. `type` = premier label du nœud.
 */
export function toGraphNode(node) {
  const props = normalizeProps(node.properties);
  const type = node.labels?.[0] || 'Unknown';
  const label = props.name || props.title || props.mbid || String(node.identity);
  return { id: props.mbid || String(node.identity), label, type, ...props };
}
