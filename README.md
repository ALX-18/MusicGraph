# MusicGraph

Visualisation et exploration du graphe de collaborations musicales, à partir des données [MusicBrainz](https://musicbrainz.org/), stockées dans Neo4j.

## Stack
- **Backend** : Node.js / Express + `neo4j-driver` (15 endpoints de lecture + search/import/stats MusicBrainz)
- **Frontend** : React 18 + Vite + TypeScript, graphe interactif (`react-force-graph-2d`)
- **Base** : Neo4j 5
- **Orchestration** : Docker Compose

## Documentation
- [`docs/CONTRACT.md`](docs/CONTRACT.md) — contrat partagé (modèle Neo4j + endpoints + formats JSON), **source de vérité**
- [`docs/BACKEND.md`](docs/BACKEND.md) — API Express + Neo4j, lancement, endpoints
- [`docs/FRONTEND.md`](docs/FRONTEND.md) — application React, pages, architecture
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) · [`docs/ANALYSE_DATA.md`](docs/ANALYSE_DATA.md) — modèle & analyse des données
- [`docs/reports/`](docs/reports/) — rapports de sprint (Alexis, Josué, Nicolas)

## Arborescence
```
musicgraph/
├── backend/        # API + Neo4j (Alexis), routes MusicBrainz/import/stats (Josué)
├── frontend/       # React (Nicolas)
├── data/           # jeu de données exporté de MusicBrainz (Josué)
├── docs/           # modèle de données, choix techniques, analyse data
├── docker-compose.yml
├── README.md
└── .env.example
```

## Démarrage rapide

### Tout en Docker
```bash
cp .env.example .env          # le .env réel n'est JAMAIS commité
docker compose up --build     # neo4j + backend + frontend
```

### Charger des données de test (seed)
La base démarre vide. Pour développer sans dépendre d'un import MusicBrainz :
```bash
docker exec -i musicgraph-neo4j cypher-shell -u neo4j -p musicgraph123 < backend/scripts/seed.cypher
```
Ou importer de vrais artistes via la page **Recherche** du frontend (bouton « Importer »).

### Accès
- Frontend : http://localhost:5173
- Backend API : http://localhost:4000/api (santé : `/api/health`)
- Neo4j Browser : http://localhost:7474 (`neo4j` / `musicgraph123`)

> Pour développer composant par composant (backend ou frontend en local hors Docker),
> voir [`docs/BACKEND.md`](docs/BACKEND.md) et [`docs/FRONTEND.md`](docs/FRONTEND.md).

## Organisation
- Branche `main` protégée (merge via Pull Request).
- 1 branche par personne : `feat/backend` (Alexis), `feat/musicbrainz-data` (Josué), `feat/frontend` (Nicolas).
- Source de vérité commune : [`docs/CONTRACT.md`](docs/CONTRACT.md). On ne change pas le contrat sans prévenir l'équipe.
