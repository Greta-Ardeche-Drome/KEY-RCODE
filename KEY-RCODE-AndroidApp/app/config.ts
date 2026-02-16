// app/config.ts
// Centralized API configuration

export const API_URLS = {
  OnPremises: "http://192.168.1.13:3000/api/v1",
  Cloud: "https://ton-api-cloud.com/api/v1", // Vraie URL à remplacer
};

// Hook pour obtenir l'API choisie (à utiliser dans les composants)
export function useApiUrl() {
  const { currentApiUrl } = require('./UserContext').useSession();
  return currentApiUrl;
} 

// On garde une valeur par défaut pour rétrocompatibilité
export const API_BASE_URL = API_URLS.OnPremises;