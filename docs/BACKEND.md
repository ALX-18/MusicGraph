# Backend MusicGraph — guide

Serveur **Express + Neo4j** qui expose le contrat API (`docs/CONTRACT.md`). Couche de **lecture** du graphe + branchements pour Josué (search/import/stats) et Nicolas (frontend).

## Lancer le backend seul

### Option A — tout en Docker (recommandé, aucune install Node requise)
```bash
cp .env.example .env                 # une seule fois
docker compose up -d neo4j           # base seule
# attendre que Neo4j soit "healthy" :
docker inspect --format='{{.State.Health.Status}}' musicgraph-neo4j
docker compose up -d --build backend # build + run du backend
docker logs -f musicgraph-backend    # logs
```
API dispo sur http://localhost:4000/api — Neo4j Browser sur http://localhost:7474 (`neo4j` / `musicgraph123`).

### Option B — backend en local (Node 20+), Neo4j en Docker
```bash
docker compose up -d neo4j
cd backend && npm install
# le backend en local joint Neo4j via localhost :
NEO4J_URI=bolt://localhost:7687 npm start
```

## Charger le seed de test
Données factices conformes au contrat (préfixe `seed-`), pour tester avant l'import MusicBrainz de Josué :
```bash
docker exec -i musicgraph-neo4j cypher-shell -u neo4j -p musicgraph123 < backend/scripts/seed.cypher
```
Ou copier/coller le contenu de `backend/scripts/seed.cypher` dans le Neo4j Browser. Le script est idempotent (rejouable) et nettoie ses propres nœuds avant de réinsérer.

## Endpoints

### ✅ Implémentés et testés (Alexis)
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | `{ status: "ok" }` |
| GET | `/api/artists` | liste paginée `?limit=&offset=` (défaut 50) |
| GET | `/api/artists/:id` | un artiste (404 si absent) |
| GET | `/api/artists/:id/recordings` | recordings de l'artiste |
| GET | `/api/artists/:id/releases` | releases de l'artiste |
| GET | `/api/artists/:id/collaborations` | `{ artist, weight }[]` |
| GET | `/api/recordings` · `/:id` · `/:id/artists` · `/:id/releases` | recordings |
| GET | `/api/releases` · `/:id` · `/:id/recordings` · `/:id/artists` | releases |
| GET | `/api/graph` | graphe global `{ nodes, links }` (`?limit=`) |
| GET | `/api/graph/artists/:id` | voisinage d'un artiste (404 si absent) |
| GET | `/api/graph/collaborations` | sous-graphe COLLABORATED_WITH |

### 🚧 Stubs 501 — à remplir par Josué
`/api/search/artists`, `/api/import/artists`, `/api/stats/overview`, `/api/stats/top-collaborations`, `/api/stats/top-artists`, `/api/stats/top-genres`.

## Conventions
- Toutes les requêtes en **Cypher paramétré** (aucune concaténation).
- `Integer` Neo4j convertis en `Number` JS (mappers `src/utils/mappers.js`).
- Pagination : `?limit=` (défaut 50, max 500), `?offset=` (défaut 0) sur les listes racines.
- Erreurs : `{ error: "..." }` + code HTTP (400 param invalide, 404 introuvable, 500 sinon).
- CORS activé pour le frontend.

## Arborescence
```
backend/
├── src/
│   ├── server.js              # bootstrap Express + montage routes + shutdown
│   ├── db/neo4j.js            # singleton driver + runQuery + waitForNeo4j + closeDriver
│   ├── db/schema.js           # contraintes d'unicité (au démarrage)
│   ├── routes/{artists,recordings,releases,graph}.js   # lecture (Alexis)
│   ├── routes/{search,import,stats}.js                 # stubs 501 (Josué)
│   ├── middlewares/errorHandler.js
│   └── utils/{mappers,pagination}.js
├── scripts/seed.cypher
├── Dockerfile · .dockerignore · package.json
```
