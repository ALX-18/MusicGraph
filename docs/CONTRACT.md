# Contrat partagé MusicGraph

## Modèle Neo4j (figé)

### Nœuds
- **Artist** `{ mbid, name, type, country, gender, beginDate, endDate, disambiguation }`
- **Recording** `{ mbid, title, length, firstReleaseDate, popularity, source }`
- **Release** `{ mbid, title, date, country, status, releaseType }`
- **Label** `{ mbid, name, country }`
- **Genre** `{ name }`
- **Area** `{ mbid, name, type }`

### Relations
```
(:Artist)-[:PERFORMED]->(:Recording)
(:Artist)-[:FEATURED_ON]->(:Recording)
(:Artist)-[:COLLABORATED_WITH {weight}]->(:Artist)
(:Recording)-[:APPEARS_ON]->(:Release)
(:Release)-[:RELEASED_BY]->(:Label)
(:Artist)-[:ASSOCIATED_WITH_GENRE]->(:Genre)
(:Artist)-[:FROM_AREA]->(:Area)
(:Release)-[:RELEASED_IN]->(:Area)
```

### Contraintes d'unicité (clé = mbid)
```cypher
CREATE CONSTRAINT artist_mbid IF NOT EXISTS FOR (a:Artist) REQUIRE a.mbid IS UNIQUE;
CREATE CONSTRAINT recording_mbid IF NOT EXISTS FOR (r:Recording) REQUIRE r.mbid IS UNIQUE;
CREATE CONSTRAINT release_mbid IF NOT EXISTS FOR (r:Release) REQUIRE r.mbid IS UNIQUE;
CREATE CONSTRAINT label_mbid IF NOT EXISTS FOR (l:Label) REQUIRE l.mbid IS UNIQUE;
CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE;
CREATE CONSTRAINT area_mbid IF NOT EXISTS FOR (a:Area) REQUIRE a.mbid IS UNIQUE;
```

## API REST — base `/api`

Tout endpoint renvoie du JSON. Erreurs au format `{ "error": "message" }` avec le bon code HTTP.

| Méthode | Route | Réponse |
|---|---|---|
| GET | `/api/artists` | `Artist[]` |
| GET | `/api/artists/:id` | `Artist` |
| GET | `/api/artists/:id/recordings` | `Recording[]` |
| GET | `/api/artists/:id/releases` | `Release[]` |
| GET | `/api/artists/:id/collaborations` | `{ artist: Artist, weight }[]` |
| GET | `/api/search/artists?q=` | `ArtistSearchResult[]` (depuis MusicBrainz, non stocké) |
| POST | `/api/import/artists` body `{ mbid }` | `{ imported: Artist, counts }` |
| GET | `/api/recordings` | `Recording[]` |
| GET | `/api/recordings/:id` | `Recording` |
| GET | `/api/recordings/:id/artists` | `Artist[]` |
| GET | `/api/recordings/:id/releases` | `Release[]` |
| GET | `/api/releases` | `Release[]` |
| GET | `/api/releases/:id` | `Release` |
| GET | `/api/releases/:id/recordings` | `Recording[]` |
| GET | `/api/releases/:id/artists` | `Artist[]` |
| GET | `/api/graph` | `{ nodes: GraphNode[], links: GraphLink[] }` |
| GET | `/api/graph/artists/:id` | `{ nodes, links }` (voisinage de l'artiste) |
| GET | `/api/graph/collaborations` | `{ nodes, links }` (artistes + COLLABORATED_WITH) |
| GET | `/api/stats/overview` | `{ artists, recordings, releases, collaborations, genres }` |
| GET | `/api/stats/top-collaborations` | `{ a: Artist, b: Artist, weight }[]` |
| GET | `/api/stats/top-artists` | `{ artist: Artist, degree }[]` |
| GET | `/api/stats/top-genres` | `{ name, count }[]` |

### Formats partagés (frontend ↔ backend)
```ts
// id = mbid partout
type Artist = { mbid, name, type, country, gender, beginDate, endDate, disambiguation }
type Recording = { mbid, title, length, firstReleaseDate, popularity, source }
type Release = { mbid, title, date, country, status, releaseType }

type ArtistSearchResult = { mbid, name, country, type, beginDate, score }

type GraphNode = { id: string, label: string, type: "Artist"|"Recording"|"Release", ...props }
type GraphLink = { source: string, target: string, type: string, weight?: number }
```

> Règle d'or : **on ne change pas ce contrat sans prévenir les 2 autres.** Toute modif = message dans le canal d'équipe + mise à jour de ce fichier.
