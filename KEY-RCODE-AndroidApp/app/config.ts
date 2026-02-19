// app/config.ts
// Centralized API configuration

export const API_URLS = {
  OnPremises: "https://localendpoint.keyrcode.app:3000/api/v1",
  Cloud: "https://api.keyrcode.app/api/v1", 
};

// Hook pour obtenir l'API choisie (à utiliser dans les composants)
export function useApiUrl() {
  const { currentApiUrl } = require('./UserContext').useSession();
  return currentApiUrl;
} 

// On garde une valeur par défaut pour rétrocompatibilité
export const API_BASE_URL = API_URLS.OnPremises;