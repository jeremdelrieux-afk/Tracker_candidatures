import { getAccessToken } from './lib/auth.mjs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';
const VEILLE_FILE = './data/offres_veille.json';

const CRITERES = [
  { motsCles: 'cybersecurite', commune: '83118', distance: 40 },
  { motsCles: 'reseaux informatique', commune: '83118', distance: 40 },
  { motsCles: 'technicien support informatique', commune: '83118', distance: 40 },
  { motsCles: 'technicien support informatique', commune: '06088', distance: 20 },
];

async function searchOffres({ motsCles, commune, distance }) {
  const token = await getAccessToken();
  const params = new URLSearchParams({
    motsCles, commune, distance: String(distance), range: '0-49', sort: '1',
  });
  const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 206) {
    const text = await res.text();
    throw new Error(`Erreur API (${res.status}) sur "${motsCles}" : ${text}`);
  }
  const data = await res.json();
  return data.resultats || [];
}

async function loadExisting() {
  if (!existsSync(VEILLE_FILE)) return [];
  const raw = await readFile(VEILLE_FILE, 'utf-8');
  try { return JSON.parse(raw); } catch { return []; }
}

function toVeilleEntry(offre, critere) {
  return {
    id: offre.id,
    intitule: offre.intitule,
    entreprise: offre.entreprise?.nom || 'Non précisé',
    lieu: offre.lieuTravail?.libelle || '?',
    dateCreation: offre.dateCreation,
    typeContrat: offre.typeContratLibelle || offre.typeContrat,
    url: offre.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${offre.id}`,
    motsClesRecherche: critere.motsCles,
    dateRecuperation: new Date().toISOString(),
    ajouteAuTracker: false,
  };
}

async function main() {
  await mkdir('./data', { recursive: true });
  const existing = await loadExisting();
  const existingIds = new Set(existing.map((o) => o.id));
  let nouvelles = [];

  for (const critere of CRITERES) {
    console.log(`🔍 "${critere.motsCles}" — centre ${critere.commune}, rayon ${critere.distance}km`);
    const offres = await searchOffres(critere);
    const inedites = offres.filter((o) => !existingIds.has(o.id));
    console.log(`   → ${offres.length} offre(s), dont ${inedites.length} nouvelle(s)`);
    nouvelles.push(...inedites.map((o) => toVeilleEntry(o, critere)));
  }

  const seenIds = new Set();
  nouvelles = nouvelles.filter((o) => {
    if (seenIds.has(o.id)) return false;
    seenIds.add(o.id);
    return true;
  });

  const seenPairs = new Set();
  nouvelles = nouvelles.filter((o) => {
    const key = `${o.entreprise}|||${o.intitule}`.toLowerCase();
    if (seenPairs.has(key)) return false;
    seenPairs.add(key);
    return true;
  });

  const merged = [...nouvelles, ...existing];
  await writeFile(VEILLE_FILE, JSON.stringify(merged, null, 2), 'utf-8');

  console.log(`\n✅ ${nouvelles.length} nouvelle(s) offre(s) ajoutée(s) à ${VEILLE_FILE}`);
  console.log(`📦 Total en base de veille : ${merged.length}`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
