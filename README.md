# tracker-candidatures

Suivi de candidatures + veille automatisée sur l'API France Travail (offres d'emploi v2).

## Structure

tracker-candidatures/
├── .env.example
├── .gitignore
├── package.json
├── public/
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

Remplis `.env` avec ton Client ID / Client Secret récupérés sur francetravail.io
(Mon espace → Mes applications → ton application → onglet clés d'accès), et
vérifie que ton application a bien souscrit à l'API "Offres d'emploi v2".

## Test de connexion

```bash
npm run test-api
```

## Lancer la veille

Personnalise tes critères dans `scripts/search-offres.mjs` (section `CRITERES`
en haut) : `motsCles`, `commune` (code INSEE, pas le code postal — ex. 83118
pour Saint-Raphaël, 06088 pour Cannes), `distance` en km. Le paramètre
`distance` n'a d'effet que combiné à `commune` : sans point central précis,
l'API renvoie tout le département.

```bash
npm run veille
```

Écrit/complète `data/offres_veille.json`. Déduplique par ID d'offre et par
paire entreprise+intitulé (pour éviter le bruit des diffusions multi-villes).

Automatisation possible via cron :
```bash
0 8 * * * cd /chemin/vers/tracker-candidatures && npm run veille
```

## Interface

Ouvre `public/index.html` dans un navigateur.

- **Onglet Tracker** : suivi manuel (statut, dates, relances, notes),
  sauvegarde locale navigateur. Exporte régulièrement en `.json`.
- **Onglet Veille** : charge `data/offres_veille.json`, bouton
  "+ Ajouter au tracker" pour préremplir une candidature.

## Sécurité

- `.env` exclu via `.gitignore`, jamais commité.
- Ne partage jamais ton Client Secret.
- Un secret exposé accidentellement doit être régénéré sur francetravail.io,
  pas juste supprimé du dernier commit (reste dans l'historique git).
