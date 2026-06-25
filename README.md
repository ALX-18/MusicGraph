# MusicGraph

Visualisation et exploration du graphe de collaborations musicales, à partir des données [MusicBrainz](https://musicbrainz.org/), stockées dans Neo4j.

## Stack
- **Backend** : Node.js / Express
- **Frontend** : React (Vite)
- **Base** : Neo4j 5
- **Orchestration** : Docker Compose

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
```bash
cp .env.example .env          # le .env réel n'est JAMAIS commité
docker compose up neo4j       # Neo4j seul tant que les Dockerfile backend/frontend n'existent pas
# puis, une fois les Dockerfile créés :
docker compose up --build
```

- Neo4j Browser : http://localhost:7474
- Backend API : http://localhost:4000/api
- Frontend : http://localhost:5173

## Organisation
- Branche `main` protégée (merge via Pull Request).
- 1 branche par personne : `feat/backend` (Alexis), `feat/musicbrainz-data` (Josué), `feat/frontend` (Nicolas).
- Source de vérité commune : [`docs/CONTRACT.md`](docs/CONTRACT.md). On ne change pas le contrat sans prévenir l'équipe.
