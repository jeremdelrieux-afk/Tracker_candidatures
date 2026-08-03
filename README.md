# tracker-candidatures

Suivi de candidatures + veille automatisée sur l'API France Travail (offres d'emploi v2) — un outil personnel construit de A à Z : script Node.js, authentification OAuth2, interface interactive, hébergement GitHub Pages, sécurisé après plusieurs revues de code.

**[Voir la démo en ligne →](https://jeremdelrieux-afk.github.io/Tracker_candidatures/)**

> La démo affiche les offres correspondant à mes propres critères de recherche (Alpes-Maritimes et Var). L'outil est personnalisable : voir la section « Lancer la veille » pour adapter les mots-clés et la zone géographique à ton propre usage.

> Guide complet pas-à-pas pour débutant (création des comptes, installation, dépannage, revue de sécurité) disponible séparément — ce README est une référence rapide qui suppose les prérequis ci-dessous déjà en place.

## Ce que fait l'outil

- **Onglet Tracker** — suivi manuel des candidatures (statut, dates, relances, notes), avec historique des changements de statut par candidature.
- **Onglet Veille** — récupère automatiquement les offres correspondant à des critères définis (mots-clés, zone géographique), avec :
  - filtres par colonne cliquables à la souris (intitulé, entreprise, lieu, contrat)
  - tri par colonne
  - badges colorés par type de contrat, date relative, repère "nouveau" (< 48h)
  - modale de détails avec description complète de l'offre
  - ajout en un clic vers le tracker, avec état "✓ Ajouté" persistant

## Prérequis

- Node.js et npm installés ([nodejs.org](https://nodejs.org))
- Git installé
- Un compte développeur sur [francetravail.io](https://francetravail.io), avec une application créée et souscrite à l'API **Offres d'emploi v2**
- Ton Client ID et Client Secret France Travail (page de ton application, onglet clés d'accès)

## Structure

```
tracker-candidatures/
├── .env.example
├── .gitignore
├── package.json
├── refresh.sh              # veille + publication en une commande
├── docs/
│   └── index.html          # interface, servie par GitHub Pages
├── scripts/
│   ├── lib/auth.mjs
│   ├── test-api-francetravail.mjs
│   └── search-offres.mjs
└── data/
    └── offres_veille.json
```

## Installation

```bash
npm install
cp .env.example .env
```

Remplis `.env` avec ton Client ID / Client Secret.

## Test de connexion

```bash
npm run test-api
```

Réponse attendue : une liste d'offres pour "informatique" dans le 83. Si tu obtiens une erreur `invalid_client`, vérifie que ton application a bien souscrit à l'API "Offres d'emploi v2" sur francetravail.io — les identifiants seuls ne suffisent pas sans cette souscription.

## Lancer la veille

Personnalise tes critères dans `scripts/search-offres.mjs` (section `CRITERES` en haut) : `motsCles`, `commune`, `distance` en km.

Le paramètre `commune` attend un **code INSEE**, pas un code postal (une commune peut avoir plusieurs codes postaux mais un seul code INSEE). Trouve le tien par recherche « code INSEE + nom de ta ville ». Le paramètre `distance` n'a d'effet que combiné à `commune` : sans point central précis, l'API renvoie tout le département.

```bash
npm run veille
```

Écrit/complète `data/offres_veille.json`. Déduplique par ID d'offre et par paire entreprise+intitulé (pour éviter le bruit des diffusions multi-villes).

## Automatisation complète (veille + publication en ligne)

Le script `refresh.sh` enchaîne veille, copie vers `docs/`, et envoi Git en une seule commande — il ne pousse que s'il y a réellement de nouvelles offres :

```bash
./refresh.sh
```

Pour l'exécuter automatiquement chaque jour via `cron` :

```bash
crontab -e
# tous les jours à 11h :
0 11 * * * /chemin/vers/tracker-candidatures/refresh.sh >> /chemin/vers/tracker-candidatures/refresh.log 2>&1
```

## Interface

En local : ouvre `docs/index.html` dans un navigateur (le chargement automatique des offres nécessite un vrai serveur — utilise le bouton "Charger" en local, ou consulte directement la [démo en ligne](https://jeremdelrieux-afk.github.io/Tracker_candidatures/)).

- **Onglet Tracker** : sauvegarde locale navigateur (`localStorage`, propre à cet ordinateur et ce navigateur). Exporte régulièrement en `.json`.
- **Onglet Veille** : charge `data/offres_veille.json` automatiquement en ligne, ou via le bouton en local.

## Dépannage rapide

| Erreur | Cause probable |
|---|---|
| `npm : commande introuvable` | Node.js/npm non installés, ou commande lancée hors du dossier du projet |
| `invalid_client` (400) | API "Offres d'emploi v2" pas encore souscrite sur francetravail.io |
| Résultats trop éloignés géographiquement | `distance` utilisé sans `commune`, ou mauvais code INSEE |
| Page blanche / erreurs en local | Le chargement automatique nécessite un vrai serveur — utilise le bouton "Charger" en local |

## Sécurité

- `.env` exclu via `.gitignore`, jamais commité.
- Ne partage jamais ton Client Secret.
- Un secret exposé accidentellement doit être régénéré sur francetravail.io, pas juste supprimé du dernier commit (reste dans l'historique git).
- Code passé par plusieurs revues de sécurité successives (échappement HTML, protection contre la pollution de prototype, validation des protocoles d'URL) — détail complet dans le guide.

## Pile technique

Node.js · API REST (OAuth2 client_credentials) · JavaScript vanilla (aucun framework front) · GitHub Pages · Git/GitHub
