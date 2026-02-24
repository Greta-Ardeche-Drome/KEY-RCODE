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
import EmergencyService, { UserLockInfo, GroupLockInfo } from '../services/emergencyService';

export default function AdminPanel() {
  const { user, session, signOut, currentApiUrl } = useSession();
  const { darkMode } = useDarkMode();
  const { resetUserLock, triggerEmergencyOpen } = useEmergencyService();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isEmergencyLoading, setIsEmergencyLoading] = useState(false);
  const [lockedUsers, setLockedUsers] = useState<UserLockInfo[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userGroupLocked, setUserGroupLocked] = useState(false);
  const [isCheckingGroup, setIsCheckingGroup] = useState(false);
  const [isUnlockingGroup, setIsUnlockingGroup] = useState(false);
  const [isUnlockingAll, setIsUnlockingAll] = useState(false);
  
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

    // Charger la liste des utilisateurs verrouillés et vérifier le groupe au démarrage
    loadLockedUsers();
    checkUserGroupStatus();
  }, [user, session, pathname]);

  // Extraire le groupe utilisateur depuis le groupe admin (DL_KRC_Admins_Site -> DL_KRC_Users_Site)
  const getUserGroupFromAdminGroup = (adminGroup: string | undefined): string | null => {
    if (!adminGroup) return null;
    const match = adminGroup.match(/CN=DL_KRC_Admins_([^,]+)/i);
    if (match) {
      const site = match[1];
      return `CN=DL_KRC_Users_${site},OU=KRC_Applicatif,DC=krc,DC=local`;
    }
    return null;
  };

  // Fonction pour charger la liste des utilisateurs verrouillés
  const loadLockedUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await emergencyService.getLockedUsers();
      if (response.success) {
        setLockedUsers(response.users);
      } else {
        setLockedUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs verrouillés:', error);
      setLockedUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Vérifier le statut du groupe utilisateur associé
  const checkUserGroupStatus = async () => {
    const userGroup = getUserGroupFromAdminGroup(user?.ldapGroup);
    if (!userGroup) return;

    setIsCheckingGroup(true);
    try {
      const response = await emergencyService.getLockedUsers();
      
      if (response.success && response.lockedGroups) {
        const isLocked = response.lockedGroups.some(
          (g: any) => g.ldap_group === userGroup
        );
        setUserGroupLocked(isLocked);
      } else {
        setUserGroupLocked(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du groupe:', error);
      setUserGroupLocked(false);
    } finally {
      setIsCheckingGroup(false);
    }
  };

  // Déverrouiller le groupe utilisateur
  const unlockUserGroup = async () => {
    const userGroup = getUserGroupFromAdminGroup(user?.ldapGroup);
    if (!userGroup) return;

    const shortGroupName = userGroup.match(/Users_([^,]+)/)?.[1] || userGroup;

    Alert.alert(
      'Déverrouillage du groupe',
      `Voulez-vous déverrouiller le groupe "${shortGroupName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déverrouiller',
          style: 'destructive',
          onPress: async () => {
            setIsUnlockingGroup(true);
            try {
              const response = await fetch(`${currentApiUrl}/emergency/reset`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session}`,
                },
                body: JSON.stringify({ ldapGroup: userGroup }),
              });

              const data = await response.json();
              if (response.ok) {
                Alert.alert('Succès', `${shortGroupName} a été déverrouillé`);
                setUserGroupLocked(false);
              } else {
                Alert.alert('Erreur', data.error || 'Impossible de déverrouiller le groupe');
              }
            } catch (error) {
              console.error('Erreur unlock group:', error);
              Alert.alert('Erreur', 'Erreur réseau');
            } finally {
              setIsUnlockingGroup(false);
            }
          }
        }
      ]
    );
  };

  // Fonction pour rafraîchir la liste
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLockedUsers();
    await checkUserGroupStatus();
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

  // Fonction pour débloquer TOUS les groupes (super-admin seulement)
  const unlockAllGroups = async () => {
    Alert.alert(
      '⚠️ Déverrouillage Global',
      'Vous êtes sur le point de déverrouiller TOUS les groupes LDAP verrouillés dans le système.\n\nCette action affectera tous les sites.\n\nÊtes-vous sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setIsUnlockingAll(true);
            try {
              const response = await fetch(`${currentApiUrl}/emergency/reset`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session}`,
                },
                body: JSON.stringify({
                  unlockAllGroups: true
                }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert(
                  '✅ Succès',
                  `${data.groupsUnlocked || 0} groupe(s) déverrouillé(s) avec succès.`,
                  [{ text: 'OK', onPress: () => checkUserGroupStatus() }]
                );
              } else {
                Alert.alert('Erreur', data.message || data.error || 'Impossible de déverrouiller les groupes');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de communiquer avec le serveur');
            } finally {
              setIsUnlockingAll(false);
            }
          }
        }
      ]
    );
  };

  const handleEmergencyOpen = async () => {
    Alert.alert(
      'Urgence Administrateur',
      'En tant qu\'administrateur, vous allez :\n\n• Ouvrir toutes les portes\n• Verrouiller les utilisateurs de votre groupe\n• Vous rester accessible\n\nÊtes-vous sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setIsEmergencyLoading(true);
            try {
              const success = await triggerEmergencyOpen(false);
              
              if (success) {
                
                try {
                  const response = await fetch(`${currentApiUrl}/emergency/trigger`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session}`,
                    },
                  });
                  
                  const data = await response.json();
                  
                  if (response.ok && data.message) {
                    Alert.alert('✅ Urgence activée', 'Portes ouvertes et utilisateurs verrouillés');
                    // Rafraîchir le statut du groupe
                    await checkUserGroupStatus();
                  } else {
                    Alert.alert('⚠️ Urgence partielle', 'Portes ouvertes mais erreur de verrouillage');
                  }
                } catch (lockError) {
                  Alert.alert('⚠️ Urgence partielle', 'Portes ouvertes mais erreur de verrouillage');
                }
              } else {
                Alert.alert('❌ Erreur', 'Impossible d\'ouvrir les portes');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de déclencher l\'ouverture d\'urgence');
            } finally {
              setIsEmergencyLoading(false);
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

        {/* Section Statut du Groupe Utilisateurs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Groupe Utilisateurs de votre Site</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={checkUserGroupStatus}
              disabled={isCheckingGroup}
            >
              {isCheckingGroup ? (
                <ActivityIndicator size="small" color={darkMode ? '#60A5FA' : '#3B82F6'} />
              ) : (
                <Text style={styles.refreshButtonText}>🔄</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionDescription}>
            Statut du groupe LDAP des utilisateurs de votre site
          </Text>

          {(() => {
            const userGroup = getUserGroupFromAdminGroup(user?.ldapGroup);
            const shortGroupName = userGroup?.match(/Users_([^,]+)/)?.[1] || 'N/A';
            
            if (!userGroup) {
              return (
                <View style={styles.groupStatusCard}>
                  <Text style={styles.emptySubtitle}>Impossible de déterminer le groupe utilisateur</Text>
                </View>
              );
            }

            return (
              <View style={[styles.groupStatusCard, userGroupLocked ? styles.groupLocked : styles.groupUnlocked]}>
                <View style={styles.groupStatusHeader}>
                  <Text style={styles.groupStatusIcon}>{userGroupLocked ? '🔒' : '✅'}</Text>
                  <View style={styles.groupStatusInfo}>
                    <Text style={styles.groupName}>{shortGroupName}</Text>
                    <Text style={[styles.groupStatus, userGroupLocked ? styles.statusLocked : styles.statusUnlocked]}>
                      {userGroupLocked ? 'VERROUILLÉ' : 'DÉVERROUILLÉ'}
                    </Text>
                  </View>
                </View>
                
                {userGroupLocked && (
                  <TouchableOpacity
                    style={[styles.unlockGroupButton, isUnlockingGroup && styles.disabledButton]}
                    onPress={unlockUserGroup}
                    disabled={isUnlockingGroup}
                  >
                    {isUnlockingGroup ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.unlockGroupButtonIcon}>🔓</Text>
                        <Text style={styles.unlockGroupButtonText}>Déverrouiller le groupe</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {!userGroupLocked && (
                  <View style={styles.groupOkMessage}>
                    <Text style={styles.groupOkText}>✓ Tous les utilisateurs de ce groupe peuvent se connecter</Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>

        {/* Section Super Admin - Déverrouillage Global */}
        {(user.email?.toLowerCase().trim() === 'administrateur@krc' || 
          user.username?.toLowerCase().trim() === 'administrateur') && (
          <View style={[styles.section, styles.superAdminSection]}>
            <View style={styles.superAdminHeader}>
              <Text style={styles.superAdminBadge}>👑 SUPER ADMIN</Text>
              <Text style={styles.sectionTitle}>Contrôle Global</Text>
            </View>
            <Text style={styles.sectionDescription}>
              En tant qu'administrateur absolu, vous pouvez déverrouiller tous les groupes du système en une seule action.
            </Text>
            <TouchableOpacity
              style={[styles.superAdminButton, isUnlockingAll && styles.disabledButton]}
              onPress={unlockAllGroups}
              disabled={isUnlockingAll}
            >
              {isUnlockingAll ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.superAdminButtonIcon}>🔓</Text>
                  <Text style={styles.superAdminButtonText}>Déverrouiller Tous les Groupes</Text>
                </>
              )}
            </TouchableOpacity>
            
            {/* Liste des utilisateurs verrouillés individuellement */}
            <View style={styles.superAdminDivider} />
            
            <View style={styles.lockedUsersHeader}>
              <Text style={styles.lockedUsersTitle}>🔒 Utilisateurs Verrouillés</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={loadLockedUsers}
                disabled={isLoadingUsers}
              >
                {isLoadingUsers ? (
                  <ActivityIndicator size="small" color={darkMode ? '#FBBF24' : '#F59E0B'} />
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
                  Tous les comptes sont actuellement accessibles
                </Text>
              </View>
            ) : (
              <View style={styles.lockedUsersList}>
                {lockedUsers.map((user, index) => (
                  <View key={index} style={styles.lockedUserItem}>
                    <View style={styles.userDetails}>
                      <Text style={styles.username}>👤 {user.username}</Text>
                      <Text style={styles.lockTime}>
                        Verrouillé le {new Date(user.triggeredAt).toLocaleString('fr-FR')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.quickUnlockButton}
                      onPress={() => quickUnlock(user.username)}
                    >
                      <Text style={styles.quickUnlockButtonText}>Débloquer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

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
  
  // Groupe utilisateurs
  groupStatusCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  groupLocked: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  groupUnlocked: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  groupStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupStatusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  groupStatusInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupStatus: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusLocked: {
    color: '#DC2626',
  },
  statusUnlocked: {
    color: '#10B981',
  },
  unlockGroupButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  unlockGroupButtonIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  unlockGroupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  groupOkMessage: {
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 8,
  },
  groupOkText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  
  // Super Admin section
  superAdminSection: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  superAdminHeader: {
    marginBottom: 12,
  },
  superAdminBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 8,
    letterSpacing: 1,
  },
  superAdminButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  superAdminButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  superAdminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  superAdminDivider: {
    height: 1,
    backgroundColor: '#F59E0B',
    marginVertical: 20,
    opacity: 0.3,
  },
  lockedUsersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedUsersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  lockedUsersList: {
    gap: 10,
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
  
  // Groupe utilisateurs
  groupStatusCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  groupLocked: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
  },
  groupUnlocked: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  groupStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupStatusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  groupStatusInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  groupStatus: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusLocked: {
    color: '#FCA5A5',
  },
  statusUnlocked: {
    color: '#6EE7B7',
  },
  unlockGroupButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  unlockGroupButtonIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  unlockGroupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  groupOkMessage: {
    backgroundColor: '#065F46',
    padding: 10,
    borderRadius: 8,
  },
  groupOkText: {
    color: '#D1FAE5',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Super Admin section
  superAdminSection: {
    borderWidth: 2,
    borderColor: '#FBBF24',
    backgroundColor: '#7C2D12',
  },
  superAdminHeader: {
    marginBottom: 12,
  },
  superAdminBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FDE047',
    marginBottom: 8,
    letterSpacing: 1,
  },
  superAdminButton: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  superAdminButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  superAdminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  superAdminDivider: {
    height: 1,
    backgroundColor: '#FBBF24',
    marginVertical: 20,
    opacity: 0.3,
  },
  lockedUsersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedUsersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  lockedUsersList: {
    gap: 10,
  },
});