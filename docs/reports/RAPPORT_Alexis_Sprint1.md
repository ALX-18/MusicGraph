# Rapport — Alexis · Sprint 1 (Backend & Neo4j)

Branche : `feat/backend` · Stack : Node 20 + Express + neo4j-driver 5 + Neo4j 5 (Docker).
Tout a été démarré et testé en conditions réelles (Neo4j + backend en Docker, seed chargé, curl sur chaque endpoint).

## Fait

Couche backend complète + **15 endpoints de lecture** implémentés et testés au curl. Conversion des `Integer` Neo4j → `Number` JS confirmée, champs manquants tolérés (`null`), pagination, et erreurs normalisées (400/404/500). Stubs 501 prêts pour Josué.

Exemples réels (backend sur `http://localhost:4000`, données du seed) :

**`GET /api/health`**
```json
{"status":"ok"}
```

**`GET /api/artists?limit=2`**
```json
[{"mbid":"seed-artist-3","name":"DJ Cipher","type":"Person","country":"US","gender":"Male","beginDate":"1990","endDate":null,"disambiguation":null},
 {"mbid":"seed-artist-4","name":"Lone Pioneer","type":"Person","country":null,"gender":null,"beginDate":null,"endDate":null,"disambiguation":null}]
```
> `seed-artist-4` n'a ni country ni gender → l'API renvoie `null` sans casser (exigence "données manquantes").

**`GET /api/artists/seed-artist-2`**
```json
{"mbid":"seed-artist-2","name":"Mona Reyes","type":"Person","country":"US","gender":"Female","beginDate":"1988","endDate":null,"disambiguation":"electronic producer"}
```

**`GET /api/artists/seed-artist-2/recordings`**
```json
[{"mbid":"seed-rec-3","title":"City Cipher","length":240000,"firstReleaseDate":"2021-11-05","popularity":64,"source":"seed"},
 {"mbid":"seed-rec-2","title":"Neon Tide","length":195000,"firstReleaseDate":"2020-06-15","popularity":72,"source":"seed"}]
```
> `length` et `popularity` sortent en nombres JS (Integer Neo4j convertis).

**`GET /api/artists/seed-artist-2/collaborations`**
```json
[{"artist":{"mbid":"seed-artist-3","name":"DJ Cipher",...},"weight":5},
 {"artist":{"mbid":"seed-artist-1","name":"The Aurora",...},"weight":3}]
```

**`GET /api/graph/collaborations`** (forme `{ nodes, links }` attendue par le front)
```json
{"nodes":[{"id":"seed-artist-1","label":"The Aurora","type":"Group",...}, ...],
 "links":[{"source":"seed-artist-1","target":"seed-artist-2","type":"COLLABORATED_WITH","weight":3}, ...]}
```

**`GET /api/graph/artists/seed-artist-2`** → voisinage : l'artiste + artistes liés (COLLABORATED_WITH) + ses recordings (PERFORMED), nœuds et liens dédupliqués.

Autres endpoints testés OK : `/api/recordings`, `/api/recordings/:id`, `/api/recordings/:id/artists`, `/api/recordings/:id/releases`, `/api/releases`, `/api/releases/:id`, `/api/releases/:id/recordings`, `/api/releases/:id/artists`, `/api/graph`.

**Cas d'erreur vérifiés :**
```
GET  /api/artists/nope            -> 404 {"error":"Artist nope introuvable"}
GET  /api/graph/artists/nope      -> 404 {"error":"Artist nope introuvable"}
GET  /api/artists?limit=abc       -> 400 {"error":"Paramètre \"limit\" invalide (entier >= 1 attendu)"}
GET  /api/blah                    -> 404 {"error":"Route GET /api/blah introuvable"}
GET  /api/search/artists?q=x      -> 501 (stub Josué)
GET  /api/stats/overview          -> 501 (stub Josué)
POST /api/import/artists          -> 501 (stub Josué)
```

## Décisions techniques

- **JS moderne en ESM** (`"type":"module"`), pas de TypeScript : couche volontairement simple et accessible à toute l'équipe. Réversible si on veut TS plus tard.
- **`neo4j-driver` officiel**, un **singleton driver** (`src/db/neo4j.js`) avec :
  - `waitForNeo4j()` : retry `verifyConnectivity()` (15× / 2s) — indispensable car Neo4j met quelques secondes à démarrer dans Docker ;
  - `runQuery(cypher, params, { write })` : helper unique, sessions READ par défaut / WRITE pour le schéma ;
  - `closeDriver()` appelé sur SIGINT/SIGTERM (arrêt propre).
- **Conversion des types** : `Integer` Neo4j → `Number` JS centralisée dans `src/utils/mappers.js` (`toArtist/toRecording/toRelease/toGraphNode`). Les `SKIP/LIMIT` reçoivent des `neo4j.int(...)` (Cypher refuse les floats).
- **Contraintes d'unicité** appliquées au démarrage (`src/db/schema.js`), idempotent via `IF NOT EXISTS`.
- **Pagination** `?limit=`(défaut 50, plafonné à 500) `?offset=`(défaut 0) sur les listes racines ; validée → 400 si invalide.
- **Cypher 100% paramétré** (aucune concaténation de strings).
- **GraphNode** : `id = mbid`, `type = premier label`, `label = name||title||mbid`, props à plat — directement exploitable par une lib de graphe côté front.
- **Erreurs centralisées** (`src/middlewares/errorHandler.js`) : `err.status` respecté, log serveur seulement pour les 5xx.

## Modifications du contrat partagé

**AUCUNE.** Le modèle Neo4j, la liste des endpoints et les formats JSON de `docs/CONTRACT.md` sont respectés à l'identique. Rien à resynchroniser pour Josué ni Nicolas.

## Pour Josué

Tes fichiers sont **déjà créés, montés dans `server.js` et renvoient 501** — tu n'as qu'à remplir les handlers, rien à câbler.

- **Search** → `backend/src/routes/search.js` : `GET /api/search/artists?q=` → `ArtistSearchResult[]`. Appel MusicBrainz à la volée (non stocké). Variables d'env dispo : `process.env.MUSICBRAINZ_BASE_URL`, `process.env.MUSICBRAINZ_USER_AGENT` (User-Agent **obligatoire**), pense au rate-limit 1 req/s.
- **Import** → `backend/src/routes/import.js` : `POST /api/import/artists { mbid }` → `{ imported: Artist, counts }`. Utilise `MERGE (a:Artist { mbid })` (les contraintes d'unicité sont déjà en place).
- **Stats** → `backend/src/routes/stats.js` : les 4 routes (overview, top-collaborations, top-artists, top-genres).

**Helpers réutilisables (déjà testés) :**
```js
import { runQuery } from '../db/neo4j.js';          // runQuery(cypher, params, { write:true } pour écrire)
import { toArtist, toRecording, toRelease, toNumber } from '../utils/mappers.js';
import { parsePagination } from '../utils/pagination.js'; // { limitInt, offsetInt } pour tes "top-*"
```
- Pour **écrire** (import) : `runQuery(cypher, params, { write: true })`.
- Pour convertir un compteur `count(*)` : `toNumber(rec.get('n'))`.
- Lance les erreurs avec `err.status = 400/404` → le middleware les formate tout seul.
- Le seed (`backend/scripts/seed.cypher`) te donne un graphe non vide pour valider tes stats avant le vrai import.

## Pour Nicolas

- **Base URL** : `http://localhost:4000/api` (déjà dans `.env.example` → `VITE_API_URL`). **CORS activé**, tu peux appeler directement.
- Les formes JSON ci-dessus (section *Fait*) sont les **réponses réelles** — code ton front contre elles.
- Pour la **vue graphe**, consomme `GET /api/graph/collaborations` ou `GET /api/graph/artists/:id` : format `{ nodes:[{id,label,type,...}], links:[{source,target,type,weight?}] }`, directement branchable sur d3-force / react-force-graph (`source`/`target` = `id` = `mbid`).
- **Avant l'import de Josué** : charge le seed (`docs/BACKEND.md`) → l'API renvoie de vraies données pour développer/tester l'UI tout de suite.
- `/api/search` et `/api/stats/*` renvoient encore **501** (Josué) — prévois un état "à venir" côté UI.

## Bloqué / À discuter

- **Direction de `COLLABORATED_WITH`** : la relation est dirigée dans le modèle, mais les collaborations sont conceptuellement symétriques. J'ai choisi `-[c:COLLABORATED_WITH]-` (non-dirigé) pour `/artists/:id/collaborations` et `/graph/artists/:id`, mais `/graph/collaborations` la lit dirigée (`->`) telle quelle. **À trancher avec Josué** : crée-t-il une seule relation dirigée à l'import, ou deux ? Ça impacte le dédup côté graphe.
- **`popularity` / `source`** sur Recording : valeurs présentes dans le seed mais pas définies par MusicBrainz directement — Josué doit décider comment les renseigner à l'import.
- **Volume du `/api/graph` global** : borné par `?limit=` (défaut 50 relations) pour ne pas tout déverser. À calibrer quand on aura le vrai volume de données.

## Prochain sprint (proposition)

- Tests automatisés (Jest + supertest) sur les endpoints de lecture.
- Endpoint `/api/graph` avec filtres (par genre, par area, profondeur de voisinage paramétrable).
- Index Neo4j complémentaires (sur `name`, `title`) pour les tris/recherches.
- Logger structuré (pino) + middleware de timing des requêtes.
- Une fois l'import de Josué prêt : revérifier tous les endpoints sur données réelles MusicBrainz (et non plus le seed).
