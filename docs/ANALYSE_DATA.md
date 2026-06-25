# Analyse Data — MusicGraph Dataset

## Résumé Exécutif

Ce rapport analyse le dataset MusicGraph composé de **10 artistes seed** (Daft Punk, Stromae, Angèle, PNL, Damso, SCH, Ninho, Kendrick Lamar, Jay-Z, Beyoncé) importés depuis **MusicBrainz** et stockés dans **Neo4j**.

**À remplir après exécution du script `build-dataset.js` avec les vraies données.**

---

## Statistiques Globales

### Compteurs

| Métrique | Valeur | Source |
|---|---|---|
| Artistes | _À générer_ | Neo4j count(Artist) |
| Recordings | _À générer_ | Neo4j count(Recording) |
| Releases | _À générer_ | Neo4j count(Release) |
| Collaborations | _À générer_ | Neo4j count(COLLABORATED_WITH) |
| Genres | _À générer_ | Neo4j count(Genre) |

---

## Top Artists (par degré de connexions)

Artistes avec le plus de relations (collaborations, features, etc.).

| Rang | Artiste | Degré | Collaborateurs |
|---|---|---|---|
| 1 | _À générer_ | _À générer_ | |
| 2 | _À générer_ | _À générer_ | |
| 3 | _À générer_ | _À générer_ | |

**Insights :**
- _À analyser après données_

---

## Top Collaborations

Paires d'artistes ayant collaboré le plus.

| Paire | Poids | Morceaux Partagés |
|---|---|---|
| _À générer_ | _À générer_ | |
| _À générer_ | _À générer_ | |

**Insights :**
- _À analyser après données_

---

## Distribution des Genres

Les genres les plus représentés dans le dataset.

| Genre | Nombre d'Artistes | Exemples |
|---|---|---|
| _À générer_ | _À générer_ | |
| _À générer_ | _À générer_ | |

**Insights :**
- _À analyser après données_

---

## Analyse de Connectivité du Graphe

### Densité et Structure

| Paramètre | Valeur | Interprétation |
|---|---|---|
| Composants connectés | _À générer_ | Nombre de sous-graphes isolés |
| Nœud central (plus haut degré) | _À générer_ | |
| Clustering coefficient | _À générer_ | Mesure de la tendance aux "cliques" |

### Observations

- _À complétér après analyse_

---

## Limitations et Biais des Données

### Biais MusicBrainz
1. **Couverture inégale par genre** : MusicBrainz a une couverture excellente pour la musique occidentale (rock, pop, électronique) mais moins complète pour d'autres genres (afro-beats, trap, etc.).
2. **Biais linguistique** : les données sont dominantes en anglais.
3. **Participation volontaire** : les enregistrements dépendent des contributeurs MB ; certains artistes ont moins de données que d'autres.

### Limitations de Détection des Collaborations
1. **Pattern matching sur joinphrase seulement** : les collaborations implicites (titre "Song with Artist", crédits flous) ne sont pas détectées.
2. **Pas de valeurs de confiance** : on ne peut pas distinguer une vrai collaboration d'une simple feature.
3. **Couverture Recording-limitée** : on ne scrape que ~50-100 recordings par artiste (limité par requête MB et rate limit).

### Données Manquantes
- **popularity** : défaut 50 (pas de source MB). Ne pas considérer comme rang réel.
- **artist.gender, artist.country** : souvent null pour les groupes.
- **recording.length** : peut être null si absent de MB.

### Période d'Analyse
- Les données reflètent l'état de MusicBrainz au moment du run du script build-dataset.
- Pas de versioning historique des collaborations.

---

## Observations Clés

### Clusters Musicaux

**À identifier après données** : quels groupes d'artistes forment des clusters serrés ?

Exemple hypothétique :
- Cluster Hip-hop français (PNL, Damso, SCH, Ninho)
- Cluster Électronique (Daft Punk, ...)
- Cluster Pop-R&B Anglophone (Kendrick, Jay-Z, Beyoncé)

### Artistes Ponts

Artistes apparaissant dans plusieurs clusters (collaborations cross-genre).

### Chemins Collaboratifs

Plus court chemin entre deux artistes éloignés (ex: Daft Punk → Kendrick Lamar).

---

## Qualité du Dataset

### Complétude
- **Recordings par artiste** : ~50-100 (limité par API).
- **Releases par recording** : ~30 (limité, même raison).
- **Collaborations détectées** : dépend de la clarté des crédits MB (bonne couverture si bien renseigné).

### Confiance
- **Artistes/Recordings/Releases** : haute (MusicBrainz community moderation).
- **Collaborations inférées** : moyenne (repose sur pattern matching joinphrase, peut rater des collabs implicites).

### Recommandations d'Usage
- ✓ Utiliser pour explorer la structure globale du graphe.
- ✓ Identifier les artistes centraux et les clusters musicaux.
- ⚠ Ne pas utiliser pour des stats absolues (ex: "Beyoncé a 500 collaborations") — ce nombre reflète MB + pattern matching, pas la réalité.
- ⚠ Vérifier manuellement les collaborations critiques si besoin de précision légale/contractuelle.

---

## Conclusion

Le dataset MusicGraph offre une **vue riche de la structure de collaboration** entre 10 artistes majeurs de genres différents. Les limitations (biais MusicBrainz, couverture recording-limitée, pattern matching) doivent être tenues en compte pour toute interprétation.

**Utilisation recommandée** : exploration visuelle et analyse structurelle du graphe, pas analyse quantitative absolue.

---

## Méthodologie

**Script** : `backend/scripts/build-dataset.js`

**Étapes** :
1. Pour chaque artiste seed, fetch depuis MusicBrainz via `/artist` API.
2. MERGE nœud Artist + genres + area.
3. Fetch ~50-100 recordings via `/recording?artist=` API.
4. Pour chaque recording, créer nœud Recording + déterminer PERFORMED vs FEATURED_ON.
5. Détecter collaborations via regex sur joinphrase (`feat.`, `&`, `avec`, etc.).
6. Fetch ~30 releases par recording via `/release?recording=` API.
7. Créer nœuds Release, Label, Area ; créer relations APPEARS_ON, RELEASED_BY, etc.
8. MERGE COLLABORATED_WITH avec weight increment.
9. Export nœuds importés en `data/musicgraph-dataset.json`.

**Rate Limiting** : 1 requête/s avec backoff exponentiel sur 429/503 (respecte MusicBrainz policy).

**Idempotence** : ré-exécuter le script n'ajoute pas de doublons (MERGE sur mbid).

---

## À Ajouter Post-Run

Après exécution du script, les sections suivantes doivent être remplies avec **les vraies données** :

1. Tableau Statistiques Globales (compteurs Neo4j réels)
2. Tableau Top Artists (query `/api/stats/top-artists`)
3. Tableau Top Collaborations (query `/api/stats/top-collaborations`)
4. Tableau Distribution Genres (query `/api/stats/top-genres`)
5. Paramètres Analyse Connectivité (calculs Cypher additionnels)
6. Observations Clés (analyse manuelle du graphe exported)

Ces informations doivent provenir de requêtes réelles contre le Neo4j importé, avec screen captures ou résultats curl.
