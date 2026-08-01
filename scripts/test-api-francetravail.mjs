import { getAccessToken } from './lib/auth.mjs';

const SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

async function main() {
  const motsCles = process.argv[2] || 'informatique';
  const departement = process.argv[3] || '83';

  console.log(`🔍 Recherche France Travail : "${motsCles}" dans le département ${departement}`);

  const token = await getAccessToken();

  const params = new URLSearchParams({
    motsCles,
    departement,
    range: '0-9',
  });

  const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 206) {
    const text = await res.text();
    throw new Error(`Erreur API (${res.status}) : ${text}`);
  }

  const data = await res.json();
  const offres = data.resultats || [];

  console.log(`✅ ${offres.length} offre(s) trouvée(s)\n`);
  offres.slice(0, 5).forEach((o) => {
    console.log(`- ${o.intitule} — ${o.entreprise?.nom || 'entreprise non précisée'} (${o.lieuTravail?.libelle || '?'})`);
  });
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
