import { getAccessToken } from './lib/auth.mjs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';
const VEILLE_FILE = './data/offres_veille.json';

// --- Personnalise tes critères de recherche ici ---
// commune = code INSEE du point central (83118 = Saint-Raphaël), distance en km à vol d'oiseau autour de ce point.
// Sans "commune", l'API ignore "distance" et renvoie tout le département (d'où Toulon qui remontait).
const CRITERES = [
  { motsCles: 'cybersecurite', commune: '83118', distance: 40 },
  { motsCles: 'reseaux informatique', commune: '83118', distance: 40 },
  { motsCles: 'technicien support informatique', commune: '83118', distance: 40 },
  { motsCles: 'technicien support informatique', commune: '06088', distance: 20 }, // 06088 = Cannes, pour couvrir Sophia Antipolis
];
// ----------------------------------------------------

// --- Filtre anti faux-positifs ---
// L'API matche les mots-clés individuellement (pas en phrase exacte) : une recherche sur
// "reseaux informatique" peut donc remonter une offre contenant juste "réseaux", sans rapport
// avec l'informatique (ex. "Géomètre en détection de réseaux enterrés"). Cette liste exclut les
// intitulés contenant un de ces mots, même s'ils ont matché un bon mot-clé par ailleurs.
// À enrichir au fil des faux positifs rencontrés.
const MOTS_EXCLUS = [
  'geometre', 'topographe', 'geomaticien',
  'canalisateur', 'canalisation',
  'assainissement', 'voirie',
  'egoutier', 'fontainier', 'vrd',
  'monteur de reseaux electriques', 'reseaux electriques',
];

function normaliserPourComparaison(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // retire les accents (é → e, etc.)
}

function estFauxPositif(offre) {
  const intituleNormalise = normaliserPourComparaison(offre.intitule);
  return MOTS_EXCLUS.some((mot) => intituleNormalise.includes(mot));
}

async function searchOffres({ motsCles, commune, distance }) {
  const token = await getAccessToken();
  const params = new URLSearchParams({
    motsCles,
    commune,
    distance: String(distance),
    range: '0-49',
    sort: '1', // tri par date de publication décroissante
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
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function toVeilleEntry(offre, critere) {
  return {
    id: offre.id,
    intitule: offre.intitule,
    entreprise: offre.entreprise?.nom || 'Non précisé',
    lieu: offre.lieuTravail?.libelle || '?',
    dateCreation: offre.dateCreation,
    typeContrat: offre.typeContratLibelle || offre.typeContrat,
    description: offre.description || '',
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

    const rejetees = offres.filter((o) => estFauxPositif(o));
    if (rejetees.length > 0) {
      console.log(`   🚫 ${rejetees.length} faux positif(s) écarté(s) : ${rejetees.map((o) => o.intitule).join(' | ')}`);
    }
    const offresFiltrees = offres.filter((o) => !estFauxPositif(o));

    const inedites = offresFiltrees.filter((o) => !existingIds.has(o.id));
    console.log(`   → ${offresFiltrees.length} offre(s) pertinente(s), dont ${inedites.length} nouvelle(s)`);
    nouvelles.push(...inedites.map((o) => toVeilleEntry(o, critere)));
  }

  // Déduplique par ID si une même offre matche plusieurs critères
  const seenIds = new Set();
  nouvelles = nouvelles.filter((o) => {
    if (seenIds.has(o.id)) return false;
    seenIds.add(o.id);
    return true;
  });

  // Déduplique les diffusions multi-villes (même entreprise + même intitulé, publiées le même jour)
  // Garde seulement la première occurrence de chaque paire entreprise/intitulé
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
