// hooks/useEmergencyService.ts
// Hook personnalisé pour utiliser le service d'urgence dans les composants React

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useSession } from '../UserContext';
import EmergencyService, { EmergencyResponse } from '../services/emergencyService';

export function useEmergencyService() {
  const { session, user, currentApiUrl, signOut } = useSession();

  // Instanciation du service avec les paramètres de l'utilisateur connecté
  const emergencyService = new EmergencyService(currentApiUrl, session || '');

  /**
   * Déclenche une ouverture d'urgence classique (toutes les portes)
   */
  const triggerEmergencyOpen = useCallback(async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté.');
      return false;
    }

    const result = await emergencyService.triggerEmergencyOpen(user.email);
    
    if (result.success) {
      Alert.alert('Urgence', result.message);
      return true;
    } else {
      Alert.alert('Erreur', result.message);
      return false;
    }
  }, [user, emergencyService]);

  /**
   * Déclenche le verrouillage d'urgence (utilisateurs de son groupe)
   * Si c'est un admin, on évite le verrouillage mais on déclenche l'ouverture
   */
  const triggerEmergencyLock = useCallback(async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté.');
      return false;
    }

    // Si l'utilisateur est admin, on déclenche juste l'ouverture d'urgence
    if (user.role === 'admin') {
      Alert.alert(
        'Mode Administrateur',
        'En tant qu\'administrateur, vous déclenchez l\'ouverture d\'urgence sans verrouillage.',
        [
          // { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Confirmer', 
            style: 'destructive',
            onPress: async () => {
              const success = await triggerEmergencyOpen();
              if (success) {
                console.log('Urgence déclenchée par l\'admin:', user.username);
              }
            }
          }
        ]
      );
      return true;
    }

    // Pour les utilisateurs normaux, on déclenche le verrouillage
    Alert.alert(
      'Verrouillage d\'urgence',
      `Attention ! Cette action va verrouiller TOUS les utilisateurs de votre groupe (${user.ldapGroup}). Continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          style: 'destructive',
          onPress: async () => {
            const result = await emergencyService.triggerEmergencyLock(user.username);
            
            if (result.success) {
              Alert.alert(
                'Verrouillage activé',
                result.message,
                [{ text: 'Compris', onPress: signOut }]
              );
            } else {
              // Vérifier si c'est une erreur de verrouillage
              if (EmergencyService.handleLockError(result, signOut)) {
                return;
              }
              Alert.alert('Erreur', result.message);
            }
          }
        }
      ]
    );
    return true;
  }, [user, emergencyService, signOut, triggerEmergencyOpen]);

  /**
   * Déverrouille un utilisateur (admin uniquement)
   */
  const resetUserLock = useCallback(async (targetUsername: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      Alert.alert('Erreur', 'Seuls les administrateurs peuvent déverrouiller des comptes.');
      return false;
    }

    const result = await emergencyService.resetUserLock(targetUsername);
    
    if (result.success) {
      Alert.alert('Succès', result.message);
      return true;
    } else {
      Alert.alert('Erreur', result.message);
      return false;
    }
  }, [user, emergencyService]);

  /**
   * Vérifie le statut de verrouillage de l'utilisateur actuel
   */
  const checkLockStatus = useCallback(async (): Promise<void> => {
    if (!user) return;

    const status = await emergencyService.checkUserLockStatus(user.email);
    
    if (status.isLocked) {
      Alert.alert(
        'Compte verrouillé',
        status.message || 'Votre compte a été verrouillé. Contactez un administrateur.',
        [{ text: 'Déconnexion', onPress: signOut }]
      );
    }
  }, [user, emergencyService, signOut]);

  return {
    triggerEmergencyOpen,
    triggerEmergencyLock,
    resetUserLock,
    checkLockStatus,
    isAdmin: user?.role === 'admin',
    userGroup: user?.ldapGroup,
  };
}

export default useEmergencyService;