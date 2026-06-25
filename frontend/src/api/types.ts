// Formes partagées issues de docs/CONTRACT.md — source de vérité.
// id = mbid partout. Tous les champs optionnels peuvent valoir null.

export interface Artist {
  mbid: string;
  name: string;
  type: string | null;
  country: string | null;
  gender: string | null;
  beginDate: string | null;
  endDate: string | null;
  disambiguation: string | null;
}

export interface Recording {
  mbid: string;
  title: string;
  length: number | null;
  firstReleaseDate: string | null;
  popularity: number | null;
  source: string | null;
}

export interface Release {
  mbid: string;
  title: string;
  date: string | null;
  country: string | null;
  status: string | null;
  releaseType: string | null;
}

export interface ArtistSearchResult {
  mbid: string;
  name: string;
  country: string | null;
  type: string | null;
  // CONTRACT type le champ sans format : peut être une année ("1993") ou une date ISO ("1993-05-17").
  beginDate: string | null;
  score: number | null;
}

export interface Collaboration {
  artist: Artist;
  weight: number;
}

// Résultat de POST /api/import/artists
export interface ImportResult {
  imported: Artist;
  counts: {
    recordings: number;
    releases: number;
    collaborations: number;
  };
}

// --- Graphe ---
// NB CONTRACT : GraphNode.type devrait valoir "Artist" | "Recording" | "Release".
// En pratique (écart backend connu) les nœuds Artist renvoient leur type MusicBrainz
// ("Person" / "Group" / ...) car la prop `type` de l'Artist écrase le type de nœud.
// On classifie donc le "kind" de façon défensive — voir graph.ts.
export interface GraphNode {
  id: string;
  label: string;
  type: string;
  // props à plat (mbid, name/title, country, popularity, ...)
  [key: string]: unknown;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  weight?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// --- Stats ---
export interface StatsOverview {
  artists: number;
  recordings: number;
  releases: number;
  collaborations: number;
  genres: number;
}

export interface TopArtist {
  artist: Artist;
  degree: number;
}

export interface TopCollaboration {
  a: Artist;
  b: Artist;
  weight: number;
}

export interface TopGenre {
  name: string;
  count: number;
}
