// app/config.ts
// Centralized API configuration avec gestion des sites On-Premises

// ─── URL Cloud (unique, pas de notion de site) ────────────────────────
export const CLOUD_API_URL = "https://api.keyrcode.app/api/v1";

// ─── Sites On-Premises connus ──────────────────────────────────────────
// Chaque site correspond à un groupe AD "DL_KRC_Users_{site}" / "DL_KRC_Admins_{site}"
// et pointe vers son propre backend local.
//
// Convention DNS : {site}.localendpoint.keyrcode.app  →  résolu par le DNS Externe vers l'IP locale du serveur backend on-premises.
// Le backend écoute sur le port 3000 en HTTPS.

export interface SiteConfig {
  /** Nom du site tel qu'il apparaît dans l'AD (ex: "Paris", "Lyon") */
  name: string;
  /** URL complète de l'API on-premises pour ce site */
  apiUrl: string;
  /** FQDN du serveur backend pour ce site (utilisé par l'auto-détection) */
  hostname: string;
  /** Description courte affichée dans le sélecteur */
  description?: string;
}

/**
 * Liste des sites on-premises pré-configurés.
 * Ajoutez un nouvel objet ici pour chaque site déployé via le script AD Deploy-KRC-Site.ps1.
 */
export const KNOWN_SITES: SiteConfig[] = [
  {
    name: "DefaultSite",
    apiUrl: "https://localendpoint.keyrcode.app:3000/api/v1",
    hostname: "localendpoint.keyrcode.app",
    description: "Site par défaut",
  },
  // ── Exemples de sites supplémentaires ──────────────────────────
  // {
  //   name: "Paris",
  //   apiUrl: "https://paris.localendpoint.keyrcode.app:3000/api/v1",
  //   hostname: "paris.localendpoint.keyrcode.app",
  //   description: "Siège – Paris",
  // },
  // {
  //   name: "Lyon",
  //   apiUrl: "https://lyon.localendpoint.keyrcode.app:3000/api/v1",
  //   hostname: "lyon.localendpoint.keyrcode.app",
  //   description: "Agence – Lyon",
  // },
];

// ─── Rétro-compatibilité : map { OnPremises, Cloud } ──────────────────
// "OnPremises" pointe vers le premier site connu par défaut.
export const API_URLS: Record<string, string> = {
  OnPremises: KNOWN_SITES[0]?.apiUrl ?? "https://localendpoint.keyrcode.app:3000/api/v1",
  Cloud: CLOUD_API_URL,
};

// ─── Résolution d'URL par site ─────────────────────────────────────────
/**
 * Résout l'URL de l'API backend pour un site donné.
 * Ordre de résolution :
 *  1. Correspondance exacte dans KNOWN_SITES
 *  2. Convention DNS : https://{site}.localendpoint.keyrcode.app:3000/api/v1
 */
export function resolveOnPremisesUrl(siteName: string): string {
  const known = KNOWN_SITES.find(
    (s) => s.name.toLowerCase() === siteName.toLowerCase()
  );
  if (known) return known.apiUrl;

  // Fallback : convention DNS basée sur le nom du site
  return `https://${siteName.toLowerCase()}.localendpoint.keyrcode.app:3000/api/v1`;
}

/**
 * Résout le hostname du backend pour un site donné (utile pour la probe).
 */
export function resolveOnPremisesHostname(siteName: string): string {
  const known = KNOWN_SITES.find(
    (s) => s.name.toLowerCase() === siteName.toLowerCase()
  );
  if (known) return known.hostname;

  return `${siteName.toLowerCase()}.localendpoint.keyrcode.app`;
}

// ─── Auto-détection / probe du serveur ─────────────────────────────────
/**
 * Tente de contacter le endpoint /health du backend pour un site donné.
 * Retourne des informations détaillées sur la connectivité.
 * Timeout configurable (par défaut 4 secondes).
 */
export async function probeOnPremisesSite(
  siteName: string,
  timeoutMs: number = 4000
): Promise<{ reachable: boolean; url: string; latencyMs: number; dnsResolved: boolean; errorType?: string }> {
  const url = resolveOnPremisesUrl(siteName);
  const healthEndpoint = url.replace(/\/api\/v1\/?$/, '/api/v1/health');
  const start = Date.now();

  console.log(`🏥 Probe ${siteName} → ${healthEndpoint}`);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(healthEndpoint, {
      method: 'GET', 
      signal: controller.signal,
    });
    clearTimeout(timer);

    const latencyMs = Date.now() - start;
    
    // Considérer aussi HTTP 404 comme "serveur joignable" car cela signifie 
    // que le serveur répond, juste que l'endpoint /health n'existe pas
    const isReachable = response.ok || response.status === 404;
    
    const result = { 
      reachable: isReachable, 
      url, 
      latencyMs, 
      dnsResolved: true,
      errorType: isReachable ? undefined : `HTTP ${response.status}`
    };
    console.log(`✅ Probe ${siteName} résultat:`, result);
    return result;
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    
    // Analyser le type d'erreur
    let dnsResolved = true;
    let errorType = 'NETWORK_ERROR';
    
    if (error?.message) {
      const msg = error.message.toLowerCase();
      if (msg.includes('network request failed') || 
          msg.includes('getaddrinfo notfound') ||
          msg.includes('name resolution') ||
          msg.includes('dns') ||
          msg.includes('host not found')) {
        dnsResolved = false;
        errorType = 'DNS_ERROR';
      } else if (msg.includes('timeout') || msg.includes('aborted')) {
        errorType = 'TIMEOUT';
      } else if (msg.includes('refused') || msg.includes('connection')) {
        errorType = 'CONNECTION_REFUSED';
      }
    }
    
    const result = { 
      reachable: false, 
      url, 
      latencyMs, 
      dnsResolved,
      errorType
    };
    console.log(`❌ Probe ${siteName} erreur:`, result, 'Error:', error?.message);
    return result;
  }
}

/**
 * Auto-détecte les sites accessibles parmi les sites connus.
 * Lance les probes en parallèle et retourne les sites joignables triés par latence.
 */
export async function autoDetectSites(
  timeoutMs: number = 4000
): Promise<Array<SiteConfig & { latencyMs: number }>> {
  const results = await Promise.all(
    KNOWN_SITES.map(async (site) => {
      const probe = await probeOnPremisesSite(site.name, timeoutMs);
      return { 
        ...site, 
        reachable: probe.reachable, 
        latencyMs: probe.latencyMs 
      };
    })
  );

  return results
    .filter((r: any) => r.reachable)
    .map((r: any) => ({
      name: r.name,
      apiUrl: r.apiUrl,
      hostname: r.hostname,
      description: r.description,
      latencyMs: r.latencyMs,
    }))
    .sort((a, b) => a.latencyMs - b.latencyMs);
}

// ─── Hook (rétro-compatibilité) ────────────────────────────────────────
export function useApiUrl() {
  const { currentApiUrl } = require('./UserContext').useSession();
  return currentApiUrl;
}

// On garde une valeur par défaut pour rétrocompatibilité
export const API_BASE_URL = API_URLS.OnPremises;