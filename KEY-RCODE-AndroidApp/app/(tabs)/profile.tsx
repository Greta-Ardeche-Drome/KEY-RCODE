import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserProvider } from ".././UserContext";

// Import du composant Login
import Login from '../login';

export default function Profile() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saveHistory, setSaveHistory] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // État de connexion
  const [userData, setUserData] = useState<{username: string, email: string, domain: string} | null>(null);

const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive', 
          onPress: () => {
            // Effacer le token stocké
            // await SecureStore.deleteItemAsync('userToken');
            
            // Mettre à jour l'état
            setIsLoggedIn(false);
            setUserData(null);
            
            // Afficher confirmation
            Alert.alert('Déconnecté', 'Vous avez été déconnecté avec succès');
          }
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Effacer l\'historique',
      'Tous vos QR codes seront supprimés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress: () => {
          Alert.alert('Succès', 'Historique effacé');
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData && isLoggedIn ? userData.username.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
            {isLoggedIn && (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
              </View>
            )}
          </View>
          <Text style={styles.headerTitle}>
            {userData && isLoggedIn ? userData.username : 'Invité'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {userData && isLoggedIn ? userData.email : 'Connectez-vous pour accéder à votre profil'}
          </Text>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Compte</Text>
            
            {/* Login/Logout Button */}
            {!isLoggedIn ? (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setShowLoginModal(true)}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={styles.menuIcon}>🔓</Text>
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuLabel}>Se connecter</Text>
                    <Text style={styles.menuDescription}>Authentification AD</Text>
                  </View>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.connectedBanner}>
                <View style={styles.connectedLeft}>
                  <Text style={styles.connectedIcon}>✅</Text>
                  <View>
                    <Text style={styles.connectedTitle}>Connecté</Text>
                    <Text style={styles.connectedSubtitle}>
                      {userData?.email || 'user@domain.com'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            {/*}
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.menuIcon}>📝</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Modifier le profil</Text>
                  <Text style={styles.menuDescription}>Nom, email, photo</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.menuIcon}>🔒</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Sécurité</Text>
                  <Text style={styles.menuDescription}>Mot de passe, 2FA</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            */}
          </View>
              
          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Préférences</Text>
            
            <View style={styles.menuItem}>
              
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                  <Text style={styles.menuIcon}>🔔</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Notifications</Text>
                  <Text style={styles.menuDescription}>Alertes et rappels</Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={notifications ? '#3B82F6' : '#F3F4F6'}
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={styles.menuIcon}>🌙</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Mode sombre</Text>
                  <Text style={styles.menuDescription}>Thème de l'app</Text>
                </View>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={darkMode ? '#3B82F6' : '#F3F4F6'}
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={styles.menuIcon}>💾</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Sauvegarder l'historique</Text>
                  <Text style={styles.menuDescription}>Conserver les QR codes</Text>
                </View>
              </View>
              <Switch
                value={saveHistory}
                onValueChange={setSaveHistory}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={saveHistory ? '#3B82F6' : '#F3F4F6'}
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FED7AA' }]}>
                  <Text style={styles.menuIcon}>🌐</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Langue</Text>
                  <Text style={styles.menuValue}>Français</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Data Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Données</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                  <Text style={styles.menuIcon}>📜</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Historique</Text>
                  <Text style={styles.menuDescription}>Voir tous les QR codes</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.warningItem]} 
              onPress={handleClearHistory}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={styles.menuIcon}>🗑️</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuLabel, styles.warningText]}>Effacer l'historique</Text>
                  <Text style={styles.menuDescription}>Action irréversible</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* App Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Application</Text>
            {/*
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.menuIcon}>📖</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Guide d'utilisation</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                  <Text style={styles.menuIcon}>❓</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Aide & Support</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.menuIcon}>⭐</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Noter l'application</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
              */}

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={styles.menuIcon}>ℹ️</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>À propos</Text>
                  <Text style={styles.menuValue}>Version 1.0.0</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          {isLoggedIn && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutItem]} 
                onPress={handleLogout}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={styles.menuIcon}>🚪</Text>
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuLabel, styles.logoutText]}>Déconnexion</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>KEY-RCODE v1.0.0</Text>
            <Text style={styles.footerSubtext}>© 2024 - Tous droits réservés</Text>
          </View>
        </ScrollView>

        {/* Login Modal */}
        <Modal
          visible={showLoginModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowLoginModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowLoginModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Login onLoginSuccess={(data) => {
              setIsLoggedIn(true);
              setUserData(data);
              setShowLoginModal(false);
            }} />
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E0E7FF',
  },
  avatarText: {
    fontSize: 45,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  menuValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  menuArrow: {
    fontSize: 28,
    color: '#D1D5DB',
    fontWeight: '200',
    marginLeft: 10,
  },
  warningItem: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  warningText: {
    color: '#F59E0B',
  },
  logoutItem: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  connectedBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  connectedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 2,
  },
  connectedSubtitle: {
    fontSize: 12,
    color: '#16A34A',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
});