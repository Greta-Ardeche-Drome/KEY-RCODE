// app/(tabs)/admin.tsx
// Page d'administration cachée - Visible uniquement pour les administrateurs

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../UserContext';
import { useDarkMode } from '../DarkModeContext';
import { useEmergencyService } from '../hooks/useEmergencyService';
import { useRouter, usePathname } from 'expo-router';
import EmergencyService, { UserLockInfo } from '../services/emergencyService';

export default function AdminPanel() {
  const { user, session, signOut, currentApiUrl } = useSession();
  const { darkMode } = useDarkMode();
  const { resetUserLock, triggerEmergencyOpen } = useEmergencyService();
  const router = useRouter();
  const pathname = usePathname();
  
  const [targetUsername, setTargetUsername] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isEmergencyLoading, setIsEmergencyLoading] = useState(false);
  const [lockedUsers, setLockedUsers] = useState<UserLockInfo[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const styles = darkMode ? darkStyles : lightStyles;
  const emergencyService = new EmergencyService(currentApiUrl, session || '');

  // Redirection si pas admin ou pas connecté
  useEffect(() => {
    if (!session || !user) {
      router.replace('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      Alert.alert(
        'Accès refusé',
        'Cette section est réservée aux administrateurs.',
        [{ text: 'Retour', onPress: () => router.replace('/(tabs)/home') }]
      );
      return;
    }

    // Charger la liste des utilisateurs verrouillés au démarrage
    loadLockedUsers();
  }, [user, session, pathname]);

  // Fonction pour charger la liste des utilisateurs verrouillés
  const loadLockedUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await emergencyService.getLockedUsers();
      if (response.success) {
        setLockedUsers(response.users);
      } else {
        // Liste vide en attendant l'implémentation de l'endpoint backend
        setLockedUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs verrouillés:', error);
      setLockedUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fonction pour rafraîchir la liste
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLockedUsers();
    setRefreshing(false);
  };

  // Déverrouillage rapide depuis la liste
  const quickUnlock = async (username: string) => {
    Alert.alert(
      'Déverrouillage rapide',
      `Déverrouiller le compte "${username}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déverrouiller',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await resetUserLock(username);
              if (success) {
                // Recharger la liste après déverrouillage
                await loadLockedUsers();
              }
            } catch (error) {
              console.error('Erreur quick unlock:', error);
              Alert.alert('Erreur', 'Une erreur est survenue.');
            }
          }
        }
      ]
    );
  };

  // Ne pas afficher si pas admin
  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.unauthorizedContainer}>
          <Text style={styles.unauthorizedText}>🚫</Text>
          <Text style={styles.unauthorizedTitle}>Accès Refusé</Text>
          <Text style={styles.unauthorizedSubtitle}>
            Cette section est réservée aux administrateurs
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.backButtonText}>← Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleEmergencyOpen = async () => {
    Alert.alert(
      'Urgence Administrateur',
      'Voulez-vous déclencher l\'ouverture d\'urgence de toutes les portes ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déclencher',
          style: 'destructive',
          onPress: async () => {
            setIsEmergencyLoading(true);
            try {
              const success = await triggerEmergencyOpen();
              if (success) {
                Alert.alert('Succès', 'Ouverture d\'urgence déclenchée');
              }
            } catch (error) {
              console.error('Erreur urgence admin:', error);
              Alert.alert('Erreur', 'Impossible de déclencher l\'ouverture d\'urgence');
            } finally {
              setIsEmergencyLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUnlockUser = async () => {
    if (!targetUsername.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom d\'utilisateur.');
      return;
    }

    Alert.alert(
      'Confirmer le déverrouillage',
      `Êtes-vous sûr de vouloir déverrouiller le compte "${targetUsername.trim()}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déverrouiller',
          style: 'destructive',
          onPress: async () => {
            setIsUnlocking(true);
            try {
              const success = await resetUserLock(targetUsername.trim());
              if (success) {
                setTargetUsername('');
                // Recharger la liste après déverrouillage
                await loadLockedUsers();
              }
            } catch (error) {
              console.error('Erreur unlock:', error);
              Alert.alert('Erreur', 'Une erreur est survenue.');
            } finally {
              setIsUnlocking(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>⚡</Text>
          <Text style={styles.headerTitle}>Panneau d'Administration</Text>
          <Text style={styles.headerSubtitle}>
            Gestion des urgences et déverrouillages
          </Text>
        </View>

        {/* Section Informations Admin */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Administrateur Connecté</Text>
          <View style={styles.adminInfo}>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
            <Text style={styles.adminName}>{user.username}</Text>
            <Text style={styles.adminEmail}>{user.email}</Text>
            <Text style={styles.adminGroup}>Groupe: {user.ldapGroup}</Text>
          </View>
        </View>

        {/* Section Ouverture d'Urgence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Ouverture d'Urgence</Text>
          <Text style={styles.sectionDescription}>
            Déclenche l'ouverture immédiate de toutes les portes du système
          </Text>
          <TouchableOpacity
            style={[styles.emergencyButton, isEmergencyLoading && styles.disabledButton]}
            onPress={handleEmergencyOpen}
            disabled={isEmergencyLoading}
          >
            {isEmergencyLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.emergencyButtonIcon}>⚡</Text>
                <Text style={styles.emergencyButtonText}>Déclencher l'Urgence</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Section Déverrouillage d'Utilisateurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔓 Déverrouillage d'Utilisateurs</Text>
          <Text style={styles.sectionDescription}>
            Déverrouillez les comptes qui ont été bloqués suite à un déclenchement d'urgence
          </Text>
          
          <View style={styles.unlockForm}>
            <Text style={styles.inputLabel}>Nom d'utilisateur à déverrouiller :</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ex: jean.dupont"
              placeholderTextColor={darkMode ? '#9CA3AF' : '#6B7280'}
              value={targetUsername}
              onChangeText={setTargetUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isUnlocking}
            />
            
            <TouchableOpacity
              style={[styles.unlockButton, (!targetUsername.trim() || isUnlocking) && styles.disabledButton]}
              onPress={handleUnlockUser}
              disabled={!targetUsername.trim() || isUnlocking}
            >
              {isUnlocking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.unlockButtonIcon}>🔓</Text>
                  <Text style={styles.unlockButtonText}>Déverrouiller</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Liste des Utilisateurs Verrouillés */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Utilisateurs Verrouillés</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadLockedUsers}
              disabled={isLoadingUsers}
            >
              {isLoadingUsers ? (
                <ActivityIndicator size="small" color={darkMode ? '#60A5FA' : '#3B82F6'} />
              ) : (
                <Text style={styles.refreshButtonText}>🔄</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {isLoadingUsers && lockedUsers.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={darkMode ? '#60A5FA' : '#3B82F6'} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : lockedUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>Aucun utilisateur verrouillé</Text>
              <Text style={styles.emptySubtitle}>
                Tous les comptes sont actuellement déverrouillés
              </Text>
            </View>
          ) : (
            <FlatList
              data={lockedUsers}
              keyExtractor={(item, index) => `${item.username}-${index}`}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={darkMode ? '#60A5FA' : '#3B82F6'}
                />
              }
              renderItem={({ item }) => (
                <View style={styles.lockedUserItem}>
                  <View style={styles.userInfo}>
                    <View style={styles.userIcon}>
                      <Text style={styles.userIconText}>🔒</Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.username}>{item.username}</Text>
                      <Text style={styles.lockTime}>
                        Verrouillé le {new Date(item.triggeredAt).toLocaleString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.quickUnlockButton}
                    onPress={() => quickUnlock(item.username)}
                  >
                    <Text style={styles.quickUnlockButtonText}>Déverrouiller</Text>
                  </TouchableOpacity>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.usersList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false} // Désactiver le scroll de la FlatList car on est déjà dans une ScrollView
            />
          )}
        </View>

        {/* Section Outils d'Administration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Outils d'Administration</Text>
          
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => Alert.alert('Info', 'Fonctionnalité en développement')}
          >
            <Text style={styles.toolButtonIcon}>📊</Text>
            <View style={styles.toolButtonContent}>
              <Text style={styles.toolButtonTitle}>Logs d'Urgence</Text>
              <Text style={styles.toolButtonSubtitle}>Consulter l'historique des alertes</Text>
            </View>
            <Text style={styles.toolButtonChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => Alert.alert('Info', 'Fonctionnalité en développement')}
          >
            <Text style={styles.toolButtonIcon}>⚙️</Text>
            <View style={styles.toolButtonContent}>
              <Text style={styles.toolButtonTitle}>Configuration Système</Text>
              <Text style={styles.toolButtonSubtitle}>Paramètres avancés du système</Text>
            </View>
            <Text style={styles.toolButtonChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES CLAIRS ---
const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { padding: 20 },
  
  // Header
  header: {
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerIcon: { fontSize: 48, marginBottom: 8 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    textAlign: 'center',
  },
  
  // Sections
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  refreshButtonText: {
    fontSize: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  // Admin Info
  adminInfo: { alignItems: 'center' },
  adminBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  adminName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  adminGroup: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  
  // Buttons
  emergencyButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  emergencyButtonIcon: { fontSize: 20, color: '#FFFFFF' },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Unlock form
  unlockForm: { gap: 12 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  unlockButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  unlockButtonIcon: { fontSize: 16, color: '#FFFFFF' },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Tool buttons
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toolButtonIcon: { fontSize: 24, marginRight: 12 },
  toolButtonContent: { flex: 1 },
  toolButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  toolButtonSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  toolButtonChevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  
  // Liste des utilisateurs verrouillés
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  usersList: {
    maxHeight: 300, // Limiter la hauteur pour éviter les problèmes de scroll
  },
  lockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userIconText: {
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  lockTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  quickUnlockButton: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  quickUnlockButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  
  // States
  disabledButton: { opacity: 0.6 },
  
  // Unauthorized
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unauthorizedText: { fontSize: 64, marginBottom: 16 },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  unauthorizedSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// --- STYLES SOMBRES ---
const darkStyles = StyleSheet.create({
  ...lightStyles,
  safeArea: { flex: 1, backgroundColor: '#1F2937' },
  
  header: {
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  
  section: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  refreshButtonText: {
    fontSize: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  adminName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F3F4F6',
    backgroundColor: '#1F2937',
  },
  
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#4B5563',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  toolButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  toolButtonSubtitle: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
    textAlign: 'center',
    marginBottom: 8,
  },
  unauthorizedSubtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
  },
  
  // Liste des utilisateurs verrouillés (mode sombre)
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#D1D5DB',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  usersList: {
    maxHeight: 300,
  },
  lockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#451818',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7F1D1D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userIconText: {
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 2,
  },
  lockTime: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  quickUnlockButton: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  quickUnlockButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
});