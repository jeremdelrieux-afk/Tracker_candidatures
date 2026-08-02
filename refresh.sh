#!/bin/bash
set -e
cd ~/Documents/github/tracker-candidatures

npm run veille
cp data/offres_veille.json docs/offres_veille.json

git add .
if git diff --cached --quiet; then
  echo "Aucune nouvelle offre, rien à publier."
else
  git commit -m "Rafraîchit les offres en ligne ($(date +%Y-%m-%d))"
  git push
  echo "Version en ligne mise à jour."
fi
