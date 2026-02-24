// services/emergencyService.ts
// Service pour gérer les situations d'urgence et le verrouillage de comptes

import { Alert } from 'react-native';

export interface EmergencyResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface UserLockInfo {
  username: string;
  triggeredAt: string;
  isLocked: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface GroupLockInfo {
  ldap_group: string;
  triggered_by: string;
  triggered_at: string;
  is_locked?: boolean; // Optionnel car l'API peut ne pas le retourner (présence = verrouillé)
}

export interface LockedUsersResponse {
  success: boolean;
  users: UserLockInfo[];
  count: number;
  lockedGroups?: GroupLockInfo[];
  totalGroupsLocked?: number;
}

export class EmergencyService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(apiUrl: string, token?: string) {
    this.baseUrl = apiUrl;
    this.authToken = token || null;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async makeRequest(
    endpoint: string, 
    method: string = 'POST', 
    body?: any
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Déclenche l'ouverture d'urgence classique (toutes les portes)
   */
  async triggerEmergencyOpen(adminId: string): Promise<EmergencyResponse> {
    try {
      const response = await this.makeRequest('/emergency', 'POST', { adminId });
      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || '🚨 Urgence signalée ! Portes Ouvertes.',
          data
        };
      } else {
        return {
          success: false,
          message: data.message || "Erreur lors de la demande d'urgence.",
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture d\'urgence:', error);
      return {
        success: false,
        message: 'Erreur réseau : impossible de contacter le serveur.',
      };
    }
  }

  /**
   * Déclenche le verrouillage d'urgence pour l'utilisateur connecté
   * Selon la logique backend, cela verrouille TOUS les utilisateurs du même groupe
   */
  async triggerEmergencyLock(username: string): Promise<EmergencyResponse> {
    try {
      const response = await this.makeRequest('/emergency/trigger', 'POST', { username });
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Verrouillage d\'urgence activé avec succès.',
          data
        };
      } else if (response.status === 403 && data.error === 'EMERGENCY_LOCKED') {
        return {
          success: false,
          message: data.message || 'Compte déjà verrouillé.',
        };
      } else {
        return {
          success: false,
          message: data.error || data.message || 'Impossible de déclencher le verrouillage d\'urgence.',
        };
      }
    } catch (error) {
      console.error('Erreur lors du verrouillage d\'urgence:', error);
      return {
        success: false,
        message: 'Erreur réseau : impossible de contacter le serveur.',
      };
    }
  }

  /**
   * Déverrouille un utilisateur spécifique (admin uniquement)
   */
  async resetUserLock(targetUsername: string): Promise<EmergencyResponse> {
    try {
      const response = await this.makeRequest('/emergency/reset', 'POST', { 
        targetUsername 
      });
      
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message || `Compte ${targetUsername} déverrouillé avec succès.`,
          data
        };
      } else {
        return {
          success: false,
          message: data.error || data.message || 'Impossible de déverrouiller le compte.',
        };
      }
    } catch (error) {
      console.error('Erreur lors du déverrouillage:', error);
      return {
        success: false,
        message: 'Erreur réseau : impossible de contacter le serveur.',
      };
    }
  }

  /**
   * Vérifie si l'utilisateur actuel est verrouillé
   * en faisant un appel simple vers une route protégée
   */
  async checkUserLockStatus(userEmail: string): Promise<{ isLocked: boolean; message?: string }> {
    try {
      const response = await this.makeRequest('/generate', 'POST', { 
        userId: userEmail 
      });

      if (response.status === 403) {
        const data = await response.json();
        if (data.error === 'EMERGENCY_LOCKED') {
          return {
            isLocked: true,
            message: data.message
          };
        }
      }

      return { isLocked: false };
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de verrouillage:', error);
      return { isLocked: false };
    }
  }

  /**
   * Récupère la liste des utilisateurs actuellement verrouillés
   */
  async getLockedUsers(): Promise<LockedUsersResponse> {
    try {
      const response = await this.makeRequest('/emergency/list', 'GET');
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          users: data.lockedUsers || [],
          count: data.totalUsersLocked || 0,
          lockedGroups: data.lockedGroups || [],
          totalGroupsLocked: data.totalGroupsLocked || 0
        };
      } else {
        // Si l'endpoint n'existe pas encore, retourner des données mockées
        if (response.status === 404) {
          return this.getMockLockedUsers();
        }
        return {
          success: false,
          users: [],
          count: 0,
          lockedGroups: [],
          totalGroupsLocked: 0
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs verrouillés:', error);
      // En cas d'erreur réseau, retourner des données mockées pour les tests
      return this.getMockLockedUsers();
    }
  }

  /**
   * Données mockées pour les tests (à supprimer une fois l'endpoint backend implémenté)
   */
  private getMockLockedUsers(): LockedUsersResponse {
    return {
      success: true,
      users: [], // Liste vide - pas d'exemples
      count: 0,
      lockedGroups: [],
      totalGroupsLocked: 0
    };
  }

  /**
   * Gère les erreurs 403 EMERGENCY_LOCKED de manière centralisée
   */
  static handleLockError(response: any, onLocked?: () => void): boolean {
    if (response?.error === 'EMERGENCY_LOCKED') {
      Alert.alert(
        'Compte verrouillé',
        response.message || 'Votre compte a été verrouillé suite à une alerte de sécurité. Veuillez contacter un administrateur.',
        [
          { 
            text: 'Compris', 
            onPress: onLocked || (() => {})
          }
        ]
      );
      return true;
    }
    return false;
  }
}

export default EmergencyService;