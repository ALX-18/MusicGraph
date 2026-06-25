// Helpers d'affichage défensifs : tout champ peut être null (cf. CONTRACT / rapports).

const EMPTY = '—';

export function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return EMPTY;
  return String(value);
}

// length d'un Recording est en millisecondes (cf. seed : 217000 → 3:37).
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return EMPTY;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// beginDate / firstReleaseDate : format variable — année seule ("1993") ou ISO ("1993-05-17").
// On affiche tel quel si non parsable, sinon une forme lisible.
export function formatDate(value: string | null | undefined): string {
  if (!value) return EMPTY;
  // Année seule
  if (/^\d{4}$/.test(value)) return value;
  // ISO complet ou partiel
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(value);
  if (match) {
    const [, y, m, d] = match;
    return d ? `${d}/${m}/${y}` : `${m}/${y}`;
  }
  return value;
}

export const EMPTY_PLACEHOLDER = EMPTY;
