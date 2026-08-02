# tracker-candidatures

Suivi de candidatures + veille automatisée sur l'API France Travail (offres d'emploi v2).

> Guide complet pas-à-pas pour débutant (création des comptes, installation, dépannage) disponible séparément — ce README est une référence rapide qui suppose les prérequis ci-dessous déjà en place.

## Prérequis

- Node.js et npm installés ([nodejs.org](https://nodejs.org))
- Git installé
- Un compte développeur sur [francetravail.io](https://francetravail.io), avec une application créée et souscrite à l'API **Offres d'emploi v2**
- Ton Client ID et Client Secret France Travail (page de ton application, onglet clés d'accès)

## Structure

tracker-candidatures/
├── .env.example
├── .gitignore
├── package.json
├── docs/
│ └── index.html
├── scripts/
│ ├── lib/auth.mjs
│ ├── test-api-francetravail.mjs
│ └── search-offres.mjs
└── data/
└── offres_veille.json


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

Automatisation possible via cron :
```bash
0 8 * * * cd /chemin/vers/tracker-candidatures && npm run veille
```

## Interface

Ouvre `docs/index.html` dans un navigateur.

- **Onglet Tracker** : suivi manuel (statut, dates, relances, notes), sauvegarde locale navigateur (localStorage — propre à cet ordinateur et ce navigateur). Exporte régulièrement en `.json`.
- **Onglet Veille** : charge `data/offres_veille.json`, bouton "+ Ajouter au tracker" pour préremplir une candidature.

## Dépannage rapide

| Erreur | Cause probable |
|---|---|
| `npm : commande introuvable` | Node.js/npm non installés |
| `invalid_client` (400) | API "Offres d'emploi v2" pas encore souscrite sur francetravail.io |
| Résultats trop éloignés géographiquement | `distance` utilisé sans `commune`, ou mauvais code INSEE |

## Sécurité

- `.env` exclu via `.gitignore`, jamais commité.
- Ne partage jamais ton Client Secret.
- Un secret exposé accidentellement doit être régénéré sur francetravail.io, pas juste supprimé du dernier commit (reste dans l'historique git).
