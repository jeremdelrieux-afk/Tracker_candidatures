# tracker-candidatures

Suivi de candidatures + veille automatisée sur l'API France Travail (offres d'emploi v2).

## Structure

```
tracker-candidatures/
├── .env.example          # modèle des identifiants (à copier en .env, jamais commité)
├── .gitignore
├── package.json
├── public/
│   └── index.html        # interface web (Tracker + Veille), ouvrir directement dans un navigateur
├── scripts/
│   ├── lib/auth.mjs              # authentification OAuth2 France Travail
│   ├── test-api-francetravail.mjs # test de connexion rapide
│   └── search-offres.mjs          # veille : interroge l'API selon tes critères
└── data/
    └── offres_veille.json  # généré automatiquement par search-offres.mjs
```

## Installation

```bash
npm install
cp .env.example .env
```

Remplis `.env` avec ton Client ID / Client Secret récupérés sur francetravail.io
(Mon espace → Mes applications → ton application → onglet clés d'accès).

## Test de connexion

```bash
npm run test-api
```

Doit afficher les premières offres trouvées pour "informatique" dans le 83.

## Lancer la veille

Personnalise tes critères de recherche dans `scripts/search-offres.mjs`
(section `CRITERES` en haut du fichier — mots-clés, département, rayon en km),
puis :

```bash
npm run veille
```

Ça écrit/complète `data/offres_veille.json` avec les nouvelles offres, sans
doublons (déduplication par ID d'offre).

Pour automatiser (ex. tous les matins), configure une tâche cron ou planifiée :

```bash
# crontab -e — exécution tous les jours à 8h
0 8 * * * cd /chemin/vers/tracker-candidatures && npm run veille
```

## Interface

Ouvre `public/index.html` dans un navigateur.

- **Onglet Tracker** : suivi manuel de tes candidatures (statut, dates,
  relances, notes). Sauvegarde automatique dans le navigateur (localStorage).
  Utilise "Exporter" régulièrement pour garder une sauvegarde `.json`.
- **Onglet Veille** : charge `data/offres_veille.json` (bouton "Charger"),
  parcours les offres trouvées, clique sur "+ Ajouter au tracker" pour
  créer une ligne de candidature préremplie.

## Sécurité

- `.env` est exclu du dépôt via `.gitignore` — ne le commite jamais.
- Ne partage jamais ton `Client Secret`, même en privé.
- Si un secret est accidentellement commité, considère-le compromis :
  régénère-le sur francetravail.io plutôt que de simplement le supprimer
  du dernier commit (il resterait dans l'historique git).
