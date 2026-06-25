# Frontend MusicGraph — guide

Application **React + Vite + TypeScript** qui consomme l'API du contrat (`docs/CONTRACT.md`) et
affiche les artistes, morceaux, sorties, statistiques et le **graphe de collaborations** interactif.

## Lancer le frontend

### Option A — en local (Node 20+), recommandé pour développer
```bash
cd frontend
cp .env.example .env            # une seule fois (VITE_API_URL pointe sur le backend)
npm install
npm run dev                     # http://localhost:5173
```
Le backend doit tourner sur `http://localhost:4000/api` (voir `docs/BACKEND.md`).
La base d'API vient de `VITE_API_URL` — **aucune URL d'API n'est codée en dur** dans les composants.

### Option B — tout en Docker
```bash
cp .env.example .env            # à la racine du repo
docker compose up --build       # neo4j + backend + frontend
```
Frontend servi sur http://localhost:5173 (build Vite + `vite preview`).

## Scripts npm
| Script | Effet |
|---|---|
| `npm run dev` | serveur de dev Vite (HMR) sur 5173 |
| `npm run build` | typecheck (`tsc -b`) + build de production dans `dist/` |
| `npm run preview` | sert le `dist/` (utilisé par le Dockerfile) |
| `npm run typecheck` | vérification TypeScript seule |

## Pages
| Route | Page | Contenu |
|---|---|---|
| `/` | Accueil | présentation + accès rapides |
| `/search` | Recherche | `GET /search/artists?q=` → résultats MusicBrainz + bouton **Importer** (`POST /import/artists`) |
| `/artists` | Artistes | `GET /artists` → grille de cartes |
| `/artists/:id` | Détail artiste | fiche + recordings + releases + collaborations + **mini-graphe** du voisinage |
| `/recordings` | Morceaux | `GET /recordings` + détail (artistes, sorties) |
| `/graph` | Graphe | 3 modes : global / collaborations / voisinage d'un artiste (`?mode=&artist=`) |
| `/stats` | Statistiques | overview + top-artists / top-collaborations / top-genres |

## Architecture
```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts          # wrapper fetch centralisé : baseURL (VITE_API_URL), ApiError, timeouts, get/post
│   │   ├── musicgraph.ts       # une fonction typée par endpoint (searchArtists, getArtists, importArtist, getGraph…)
│   │   └── types.ts            # formes du CONTRACT (Artist, Recording, Release, GraphNode, stats…)
│   ├── lib/
│   │   ├── useAsync.ts         # hook loading/erreur/succès + reload
│   │   ├── format.ts           # display(null→«—»), formatDate, formatDuration
│   │   └── graph.ts            # nodeKind()/couleurs/légende (classification défensive des nœuds)
│   ├── components/
│   │   ├── layout/Layout.tsx   # nav + <Outlet>
│   │   ├── state/              # Loading, ErrorState, EmptyState, AsyncBoundary
│   │   ├── GraphView.tsx       # react-force-graph-2d + légende + clic-nœud
│   │   ├── ArtistCard, SearchBar, StatCard, BarChart, Table
│   ├── pages/                  # HomePage, SearchPage, ArtistsPage, ArtistDetailPage,
│   │                           # RecordingsPage, GraphPage, StatsPage
│   ├── styles/{tokens,global}.css
│   ├── App.tsx                 # routing (react-router-dom v6)
│   └── main.tsx
├── Dockerfile · vite.config.ts · tsconfig.json · package.json
```

## Conventions
- **Toute** la surface API passe par `api/musicgraph.ts` + `api/client.ts` (baseURL = `VITE_API_URL`).
- **3 états garantis** sur chaque page (loading / erreur / vide) via `useAsync` + `AsyncBoundary` :
  jamais d'écran blanc, même API éteinte (message clair + bouton « Réessayer »).
- Champs `null` tolérés partout (`display()` → « — »), dates à format variable absorbées (`formatDate`).
- **Graphe** : `id = mbid`, `source`/`target` directement branchés ; coloration par type de nœud avec
  reclassement défensif (voir écart ci-dessous) ; clic sur un nœud Artist → sa fiche.
- Styling : **CSS Modules** scopés par composant + variables de thème dans `styles/tokens.css`.

## Écarts au contrat connus (côté front)
- **`GraphNode.type` des nœuds Artist** : l'API renvoie le type MusicBrainz (`Person`/`Group`) au lieu
  de `"Artist"`. Contourné via `lib/graph.ts → nodeKind()` (reclasse en `Artist`). À corriger côté
  mapper backend ; suivi dans `docs/reports/RAPPORT_Nicolas_Sprint1.md`.
- **`ArtistSearchResult.beginDate`** : format non figé (année / ISO / `null`) → traité comme string.

## Stack & choix
- **React 18 + Vite 5 + TypeScript**, `react-router-dom` v6.
- **`react-force-graph-2d`** pour le graphe (format `{nodes,links}` du backend directement compatible).
- **CSS Modules + tokens** (pas de framework CSS), thème sombre responsive.
- Détails et captures : `docs/reports/RAPPORT_Nicolas_Sprint1.md`.
