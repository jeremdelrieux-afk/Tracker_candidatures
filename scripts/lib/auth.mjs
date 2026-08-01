import 'dotenv/config';

const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';

let cachedToken = null;
let cachedExpiry = 0;

/**
 * Récupère un token OAuth2 valide, en le mettant en cache pour éviter
 * de redemander un token à chaque appel (le token dure ~25 minutes).
 */
export async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedExpiry - 30_000) {
    return cachedToken;
  }

  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  const scope = process.env.FRANCE_TRAVAIL_SCOPE || 'api_offresdemploiv2 o2dsoffre';

  if (!clientId || !clientSecret) {
    throw new Error(
      'FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET manquants. Copie .env.example vers .env et remplis-le.'
    );
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur d'authentification France Travail (${res.status}) : ${text}`);
  }

  const json = await res.json();
  cachedToken = json.access_token;
  cachedExpiry = now + json.expires_in * 1000;
  return cachedToken;
}
