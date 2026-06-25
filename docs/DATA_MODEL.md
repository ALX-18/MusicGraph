# Data Model — MusicBrainz → Neo4j

## Mapping MusicBrainz → Nœuds Neo4j

### Artist
| Champ MB | Nœud Neo4j | Type | Notes |
|---|---|---|---|
| `id` | `mbid` | String | Clé unique (CONSTRAINT) |
| `name` | `name` | String | |
| `type` | `type` | String | "Person", "Group", etc. |
| `country` | `country` | String | Code ISO (US, FR, etc.) ou null |
| `gender` | `gender` | String | "Male", "Female", etc. ou null |
| `life-span.begin-date` | `beginDate` | String (YYYY-MM-DD) ou null |
| `life-span.end-date` | `endDate` | String (YYYY-MM-DD) ou null |
| `disambiguation` | `disambiguation` | String | Description supplémentaire ou null |

### Recording
| Champ MB | Nœud Neo4j | Type | Notes |
|---|---|---|---|
| `id` | `mbid` | String | Clé unique (CONSTRAINT) |
| `title` | `title` | String | |
| `length` | `length` | Integer | Millisecondes ou null |
| `first-release-date` | `firstReleaseDate` | String (YYYY-MM-DD) ou null |
| _générée_ | `popularity` | Integer | Défaut 50 (pas de source MB directe) |
| _générée_ | `source` | String | "musicbrainz" ou "seed" |

### Release
| Champ MB | Nœud Neo4j | Type | Notes |
|---|---|---|---|
| `id` | `mbid` | String | Clé unique (CONSTRAINT) |
| `title` | `title` | String | |
| `date` | `date` | String (YYYY-MM-DD) ou null |
| `country` | `country` | String | Code ISO ou null |
| `status` | `status` | String | "Official", "Promotion", etc. ou null |
| `release-group.type` | `releaseType` | String | "Album", "Single", "EP", etc. ou null |

### Label
| Champ MB | Nœud Neo4j | Type | Notes |
|---|---|---|---|
| `id` | `mbid` | String | Clé unique (CONSTRAINT) |
| `name` | `name` | String | |
| `country` | `country` | String | Code ISO ou null |

### Genre
| Champ MB | Nœud Neo4j | Type | Notes |
|---|---|---|---|
| `name` | `name` | String | Clé unique (CONSTRAINT) |
| _source_ | _source_ | — | Provenant de `recordings[].genres[].name` |

### Area
| Champ MB | Nœud Neo4j | Type | Notes |
|---|---|---|---|
| `id` | `mbid` | String | Clé unique (CONSTRAINT) |
| `name` | `name` | String | Pays/région |
| `type` | `type` | String | "Country", "City", etc. ou null |

---

## Relations

### PERFORMED
**Artist → Recording**
- Artiste principal qui a enregistré le morceau.
- Créée si l'artiste apparaît dans `recording.artist-credit` (pas de `feat./featuring/...`).

### FEATURED_ON
**Artist → Recording**
- Artiste featured/collaborateur sur le morceau.
- Créée si l'artiste apparaît dans `recording.artist-credit` **avec** joinphrase contenant une collaboration (feat., featuring, ft., avec, x, &).

### PERFORMED / FEATURED_ON
**Recording → Release** via `APPEARS_ON`
- Le morceau fait partie d'une release.

### RELEASED_BY
**Release → Label**
- Release publiée par ce label.
- Source : `release['label-info'][].label`

### RELEASED_IN
**Release → Area**
- Release publiée dans ce pays/région.
- Source : `release.country` ou `release.area`

### ASSOCIATED_WITH_GENRE
**Artist → Genre**
- Artiste associé à ce genre.
- Source : recordings rattachées à l'artiste + `recording.genres[]`

### FROM_AREA
**Artist → Area**
- Artiste originaire de cette région.
- Source : `artist.area`

### COLLABORATED_WITH {weight}
**Artist → Artist**
- Artistes ayant collaboré sur au moins un morceau.
- **weight** : nombre de morceaux/collaborations partagés (incrément via MERGE).
- Créée si deux artistes partagent un morceau et si l'un est crédité en featuring de l'autre.

---

## Logique de Détection des Collaborations

### Pattern Matching
Une collaboration est détectée quand :
1. Un recording a **plusieurs artist-credits** (≥ 2).
2. Au moins un `artist-credit.joinphrase` contient une des patterns suivantes (case-insensitive) :
   - `feat.` / `featuring`
   - `ft.`
   - `avec`
   - `x`
   - `&`

### Exemple
```json
{
  "title": "Song Title",
  "artist-credit": [
    { "name": "Artist A", "mbid": "aaa", "joinphrase": "" },
    { "name": "Artist B", "mbid": "bbb", "joinphrase": " feat. " },
    { "name": "Artist C", "mbid": "ccc", "joinphrase": " & " }
  ]
}
```

Résultat :
- **Artist A** : PERFORMED → Recording
- **Artist B** : FEATURED_ON → Recording (pattern `feat.` détecté)
- **Artist C** : FEATURED_ON → Recording (pattern `&` détecté)
- Relations créées :
  - `A -[COLLABORATED_WITH {weight:1}]-> B`
  - `A -[COLLABORATED_WITH {weight:1}]-> C`
  - `B -[COLLABORATED_WITH {weight:1}]-> A`
  - `C -[COLLABORATED_WITH {weight:1}]-> A`
  - (et si B/C collaborent ensemble sur d'autres morceaux, leurs weights s'incrémentent)

### Limitations
- **Pas de détection par titre** : les patterns dans `recording.title` (ex: "Song feat. Artist") ne sont pas analysés, seulement les joinphrase.
- **Un seul niveau** : on ne scrape pas les artist-credits des credits des artist-credits (impossibilité MB).
- **Joinphrase vide = pas collab détectée** : si deux artistes sont crédités sans joinphrase explicite (ex: "A and B"), ce n'est pas détecté comme collab.

---

## Données Manquantes

### Gestion NULL
- Tous les nœuds acceptent `null` sur les champs optionnels.
- Exemple : `Artist.gender = null` si absent de MB, l'API renvoie quand même le nœud avec `{ ..., gender: null, ... }`.
- **Pas de fallback** : on ne substitue pas les valeurs manquantes (ex: pas de `country = "Unknown"`).

### Recording.popularity
- **MusicBrainz n'expose pas directement la popularité.**
- Défaut : `popularity = 50` (neutre) à l'import.
- Peut être enrichi ultérieurement par des sources externes (Spotify, Last.fm) si nécessaire.

### Recording.source
- Toujours `"musicbrainz"` pour les données importées.
- `"seed"` pour les données du fichier seed initial.

---

## Contraintes d'Unicité

```cypher
CREATE CONSTRAINT artist_mbid IF NOT EXISTS FOR (a:Artist) REQUIRE a.mbid IS UNIQUE;
CREATE CONSTRAINT recording_mbid IF NOT EXISTS FOR (r:Recording) REQUIRE r.mbid IS UNIQUE;
CREATE CONSTRAINT release_mbid IF NOT EXISTS FOR (r:Release) REQUIRE r.mbid IS UNIQUE;
CREATE CONSTRAINT label_mbid IF NOT EXISTS FOR (l:Label) REQUIRE l.mbid IS UNIQUE;
CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE;
CREATE CONSTRAINT area_mbid IF NOT EXISTS FOR (a:Area) REQUIRE a.mbid IS UNIQUE;
```

**Idempotence** : toutes les opérations utilisent `MERGE (x { primaryKey }) SET ...`, donc ré-importer le même artiste ne duplique rien, met à jour seulement.

---

## Rate Limiting & MusicBrainz Policy

- **User-Agent OBLIGATOIRE** : chaque requête doit inclure `User-Agent: MusicGraph/1.0 (email@example.com)`.
- **Max 1 req/s** : file d'attente + délai 1100ms entre appels.
- **Retry logic** :
  - 429 (Too Many Requests) : backoff exponentiel (1s, 2s, 4s)
  - 503 (Service Unavailable) : idem
  - Timeout : jusqu'à 3 tentatives
- **Sous-requêtes** : utilisation de `inc=` pour aggréger les données (ex: `inc=artists+releases+genres`), réduit le nombre d'appels.

---

## Seed Dataset

Un seed initial (`backend/scripts/seed.cypher`) contient des artistes fictifs pour test :
- `seed-artist-1`, `seed-artist-2`, etc.
- Valeurs : types, genres, releases diverses, collaborations manuellement injektées.
- Utilisé pour tester les endpoints sans dépendre de MusicBrainz.

Le script `build-dataset.js` importe 10 artistes réels depuis MusicBrainz :
1. Daft Punk
2. Stromae
3. Angèle
4. PNL
5. Damso
6. SCH
7. Ninho
8. Kendrick Lamar
9. Jay-Z
10. Beyoncé

Toutes les données importées via ce script proviennent de MusicBrainz ; la détection de collaborations est traitée selon la logique ci-dessus.
