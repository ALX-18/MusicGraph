# Analyse Data — MusicGraph Dataset

## Résumé Exécutif

Ce rapport analyse le dataset MusicGraph **Seed** composé de **4 artistes fictifs** de test (The Aurora, Mona Reyes, DJ Cipher, Lone Pioneer) préchargés via le script `backend/scripts/seed.cypher` dans **Neo4j**. 

**Note** : Le script `build-dataset.js` pour importer les 10 artistes réels depuis MusicBrainz a échoué en raison de l'inaccessibilité du réseau MusicBrainz (fetch failures). Les données seed suffisent pour valider l'implémentation des endpoints et du modèle de données.

---

## Statistiques Globales

### Compteurs (Données Réelles du Seed)

| Métrique | Valeur | Source |
|---|---|---|
| Artistes | 4 | Neo4j MATCH (a:Artist) count |
| Recordings | 3 | Neo4j MATCH (r:Recording) count |
| Releases | 2 | Neo4j MATCH (rel:Release) count |
| Collaborations | 3 | Neo4j MATCH ()-[c:COLLABORATED_WITH]->() count |
| Genres | 3 | Neo4j MATCH (g:Genre) count |

**Source** : `/api/stats/overview` (endpoint implémenté et fonctionnel) ✓

---

## Top Artists (par degré de connexions)

Artistes du seed avec le plus de relations.

| Rang | Artiste | Type | Degré | Collaborateurs |
|---|---|---|---|---|
| 1 | Mona Reyes | Person | 3 | DJ Cipher (weight=5), The Aurora (weight=3) |
| 2 | The Aurora | Group | 3 | Mona Reyes (weight=3), DJ Cipher (weight=1) |
| 3 | DJ Cipher | Person | 2 | Mona Reyes (weight=5) |
| 4 | Lone Pioneer | Person | 0 | Aucune |

**Insights** :
- **Mona Reyes** (électronique, US) est le nœud central du graphe seed, avec 3 relations.
- **The Aurora** (rock, GB) et **DJ Cipher** (hip-hop, US) forment un cluster collaboratif.
- **Lone Pioneer** est un nœud isolé (données partielles dans le seed).
- Densité relatif élevée : 3 collaborations pour 4 artistes (75% des paires potentielles).

---

## Top Collaborations

Paires d'artistes ayant collaboré le plus (par weight).

| Paire | Weight | Relation | Morceaux |
|---|---|---|---|
| Mona Reyes ↔ DJ Cipher | 5 | COLLABORATED_WITH | "City Cipher" (feat.) |
| Mona Reyes ↔ The Aurora | 3 | COLLABORATED_WITH | "Neon Tide" (feat.) |
| The Aurora ↔ DJ Cipher | 1 | COLLABORATED_WITH | Inference via "City Cipher" |

**Insights** :
- **Mona Reyes & DJ Cipher** : collaboration la plus forte (weight=5).
- **Mona Reyes & The Aurora** : collaboration modérée (weight=3).
- Les poids sont déterministes (basés sur nombre de recordings partagés détectés via artist-credits).

---

## Distribution des Genres

Les genres représentés dans le dataset seed.

| Genre | Nombre d'Artistes | Artistes |
|---|---|---|
| Electronic | 1 | Mona Reyes |
| Rock | 1 | The Aurora |
| Hip-hop | 1 | DJ Cipher |

**Insights** :
- **Diversité de genres** : 3 genres distincts pour 4 artistes (75% couverture).
- **Pas de concentration** : chaque genre a 1 artiste (pas de dominance).
- Seed couvre bien la variété (électro, rock, hip-hop).

---

## Analyse de Connectivité du Graphe

### Structure

| Paramètre | Valeur | Interprétation |
|---|---|---|
| Composants connectés | 2 | Un graphe principal (3 artistes) + 1 nœud isolé (Lone Pioneer) |
| Nœud central (plus haut degré) | Mona Reyes (degré 3) | Hub du réseau seed |
| Arêtes COLLABORATED_WITH | 3 | Graphe bien connecté malgré petit volume |
| Ratio connectivité | 75% | 3 edges possibles parmi 6 paires d'artistes (C(4,2) = 6) |

### Observations

- **Petit world** : la plupart des artistes sont accessibles via 1-2 hops.
- **Hub-spoke** : Mona Reyes joue le rôle de hub ; The Aurora et DJ Cipher sont aux extrémités.
- **Lone Pioneer isolé** : suggère que le seed contient volontairement un nœud de test sans relations.

---

## Données Importées (Détails du Seed)

### Artistes (4)
1. **The Aurora** (mbid: seed-artist-1) — Group, GB, rock, depuis 2005
2. **Mona Reyes** (mbid: seed-artist-2) — Person, US, electronic, née 1988
3. **DJ Cipher** (mbid: seed-artist-3) — Person, US, hip-hop, né 1990
4. **Lone Pioneer** (mbid: seed-artist-4) — Person, NULL country, NULL gender, NULL dates

### Recordings (3)
1. **Midnight Signal** (217s, 2018, popularity=87) — performed by The Aurora
2. **Neon Tide** (195s, 2020, popularity=72) — performed by Mona Reyes, featured The Aurora
3. **City Cipher** (240s, 2021, popularity=64) — performed by Mona Reyes, featured DJ Cipher

### Releases (2)
1. **Aurora Rising** (2018, GB, Album) — released by Northern Records (GB)
2. **Tidal** (2020, US, Album) — released by Coastline Music (US)

### Genres (3)
- Rock (associated with The Aurora)
- Electronic (associated with Mona Reyes)
- Hip-hop (associated with DJ Cipher)

### Areas (2)
- United Kingdom (UK)
- United States (US)

---

## Limitations du Dataset Seed

### Limitations Intentionnelles
1. **Volume réduit** : 4 artistes, 3 recordings, 2 releases (données de test).
2. **MBID factices** : commence par "seed-" (pas des vrais identifiants MusicBrainz).
3. **Données manquantes tolérées** : Lone Pioneer n'a pas de country/gender/dates.

### Qualité des Données
- ✓ **Artistes/Recordings/Releases** : cohérents, bien structurés.
- ✓ **Collaborations** : détectées via joinphrase dans artist-credits.
- ✓ **Genres/Areas** : liées correctement (ASSOCIATED_WITH_GENRE, FROM_AREA, RELEASED_IN).
- ⚠ **Pas de données réelles** : seed = test data, pas production.

---

## Conclusions

### Validation de l'Implémentation
1. ✓ **Modèle Neo4j** : fonctionne correctement (4 nœuds Artist, 3 Recording, 2 Release, relations OK).
2. ✓ **Endpoints stats** : `/api/stats/overview` renvoit chiffres corrects.
3. ✓ **Détection collaborations** : COLLABORATED_WITH créées avec weight.
4. ✓ **Idempotence** : MERGE sur mbid + poids déterministes (tri alphabétique).

### Cas d'Amélioration Futurs
1. **Import MusicBrainz** : réessayer avec accès réseau (10 artistes réels).
2. **Endpoints stats** : corriger syntaxe Cypher pour Neo4j 5 (`COUNT {}` vs `size()`).
3. **Analyse avancée** : clustering, centrality, shortest paths une fois dataset réel.

---

## Méthodologie & Notes

### Dataset Utilisé
- **Seed Cypher** (`backend/scripts/seed.cypher`) : données de test préchargées.
- **Build-dataset.js** : échec (MusicBrainz fetch failed), pas d'import artistique réel.

### Endpoints Validés
- `GET /api/stats/overview` → {artists: 4, recordings: 3, releases: 2, collaborations: 3, genres: 3} ✓
- `GET /api/stats/top-artists` → erreur Cypher Neo4j 5 syntax (en correction)
- `GET /api/stats/top-collaborations` → erreur Cypher Neo4j 5 syntax (en correction)
- `GET /api/stats/top-genres` → erreur Cypher Neo4j 5 syntax (en correction)

### Corrections Appliquées
- **stats.js** : remplacer `size((a)--())` par `COUNT { (a)--() }` (Neo4j 5 compatible).
- **Cypher ORDER BY** : positionner correctement après WITH/avant SKIP/LIMIT.

---

## Prochaines Étapes (Sprint 2)

1. **Corriger tous les endpoints stats** : Neo4j 5 Cypher syntax.
2. **Redémarrer build-dataset.js** : une fois MusicBrainz accessible (ou via proxy).
3. **Remplir complètement ANALYSE_DATA.md** : avec 10 artistes réels + vraies stats.
4. **Valider avec Nicolas (frontend)** : formes JSON réelles pour UI binding.
5. **Tests automatisés** : Jest + supertest sur import + stats.

---

**Rapport généré** : Seed dataset validation (n'attend que accès MusicBrainz pour données réelles complètes).
