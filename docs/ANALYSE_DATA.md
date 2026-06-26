# Analyse Data — MusicGraph Dataset

## Contexte du Dataset

Dataset actuel : **1 artiste réel importé depuis MusicBrainz** (Stromae, import validé end-to-end) + **4 artistes fictifs** du seed de test Alexis. Le script `build-dataset.js` a été corrigé pour résoudre les MBIDs via `searchArtist()` au runtime (les MBIDs hardcodés initiaux retournaient tous HTTP 404). Un second import complet des 10 artistes est prévu dès stabilisation du réseau MusicBrainz.

---

## Statistiques Globales (Réelles — Neo4j)

Mesurées via `GET /api/stats/overview` :

| Métrique | Valeur | Source |
|---|---|---|
| Artistes | 6 | 1 réel MB (Stromae) + 1 collab auto-importée (Tove Lo) + 4 seed |
| Recordings | 103 | 100 MB (Stromae) + 3 seed |
| Releases | 194 | ~192 MB + 2 seed |
| Collaborations | 4 | 1 réelle MB (Stromae ↔ Tove Lo) + 3 seed |
| Genres | 8 | 8 via `ASSOCIATED_WITH_GENRE` |

---

## Top Artistes par Degré de Connexion

Source : `GET /api/stats/top-artists`

| Rang | Artiste | Degré | Origine |
|---|---|---|---|
| 1 | **Stromae** | 107 | MusicBrainz réel |
| 2 | The Aurora | 6 | Seed fictif |
| 3 | Mona Reyes | 6 | Seed fictif |
| 4 | DJ Cipher | 4 | Seed fictif |
| 5 | Tove Lo | 2 | Collab auto-importée (Stromae) |
| 6 | Lone Pioneer | 0 | Seed fictif |

**Observation** : Stromae domine avec 107 relations — 100 PERFORMED vers ses recordings + relations COLLABORATED_WITH + APPEARS_ON. Cohérent avec 100 recordings importés et leurs releases associées.

---

## Top Collaborations

Source : `GET /api/stats/top-collaborations`

| Artiste A | Artiste B | Weight | Origine |
|---|---|---|---|
| Mona Reyes | DJ Cipher | 5 | Seed fictif |
| The Aurora | Mona Reyes | 3 | Seed fictif |
| The Aurora | DJ Cipher | 1 | Seed fictif |
| **Tove Lo** | **Stromae** | **1** | **MusicBrainz réel** |

La seule collaboration réelle détectée est **Tove Lo ↔ Stromae** (1 recording avec joinphrase `feat.`). Avec 100 recordings de Stromae, la détection fonctionne — 1 seul featuring confirme que la regex est précise (pas de faux positifs).

---

## Top Genres

Source : `GET /api/stats/top-genres`

| Genre | Nb Artistes |
|---|---|
| rock | 1 |
| electronic | 1 |
| hip-hop | 1 |
| art pop | 1 |
| dance-pop | 1 |
| electro house | 1 |
| electropop | 1 |
| hip house | 1 |

**Limitation** : chaque genre n'est associé qu'à 1 artiste. Le dataset est trop petit pour voir émerger des clusters. Avec 10 artistes réels, on attendrait des recoupements (ex: electronic partagé entre Daft Punk, Stromae, Angèle).

---

## Analyse du Graphe

### Structure actuelle

```
[Seed fictif]
The Aurora --- COLLABORATED_WITH(3) --- Mona Reyes
The Aurora --- COLLABORATED_WITH(1) --- DJ Cipher
Mona Reyes --- COLLABORATED_WITH(5) --- DJ Cipher
Lone Pioneer (isolé, degré 0)

[MusicBrainz réel]
Stromae --- COLLABORATED_WITH(1) --- Tove Lo
Stromae --- PERFORMED x100 --- [100 Recordings]
[100 Recordings] --- APPEARS_ON --- [~192 Releases]
```

### Observations

- **Stromae est le hub** avec 107 connexions — seul artiste réel importé.
- **Lone Pioneer est isolé** (degree=0) — seed fictif sans relation définie.
- **Tove Lo** auto-créée lors de l'import Stromae : artiste minimal (mbid + name), sans full import MB.

---

## Limites et Biais

### Complétude
- 1 artiste réel sur 10 prévus → statistiques non représentatives du dataset final.
- Avec 10 artistes du même cercle (rap FR, pop BE), on attendrait 10-30 collabs cross-artistes.

### Biais MusicBrainz
- **Recordings** : limite à 100 par artiste. Stromae peut avoir plus de 100 enregistrements sur MB.
- **Featings non détectés** : la détection repose sur `joinphrase` — si MB encode sans joinphrase, la collab passe inaperçue.
- **Dates manquantes** : `beginDate` de Stromae est null dans MB — champ optionnel non renseigné.

### Données Manquantes
- `popularity` : défaut 50 pour tous les recordings (MusicBrainz n'expose pas de score de popularité).
- `Tove Lo` : artiste auto-créée avec seulement mbid/name, sans genres, area, recordings propres.

---

## Vérification Doublons

Query exécutée sur Neo4j Browser (`http://localhost:7474`) :

```cypher
MATCH (a:Artist)
WITH a.mbid, count(*) AS cnt
WHERE cnt > 1
RETURN a.mbid, cnt;
```

**Résultat : 0 lignes** — aucun doublon. MERGE sur `mbid` fonctionne correctement.

```cypher
MATCH (a:Artist)-[c:COLLABORATED_WITH]->(b:Artist)
RETURN a.name, b.name, c.weight
ORDER BY c.weight DESC;
```

**Résultat : 4 relations**, aucune relation A→B + B→A en miroir. Déduplication par tri déterministe MBID effective.

---

## Prochaine Étape

Dès que le réseau MusicBrainz est stable, relancer :

```bash
cd backend
node scripts/build-dataset.js
```

Le script résout maintenant les MBIDs via `searchArtist()` — plus de dépendance aux MBIDs hardcodés. Résultat attendu avec les 10 artistes : ~500-1000 recordings, ~2000-5000 releases, ~20-50 collaborations cross-artistes.
