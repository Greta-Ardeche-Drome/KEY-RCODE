import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from "../UserContext";
import { useDarkMode } from '../DarkModeContext';

export default function Profile() {
  // 1. TOUS LES HOOKS EN PREMIER (Ordre immuable)
  const [notifications, setNotifications] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut, user, session, isLocked, currentApiUrl, currentSite, apiChoice } = useSession();
  const { darkMode, setDarkMode } = useDarkMode();
  
  // Variables dérivées
  const isAdmin = user?.role === 'admin';
  const emergencyLock = { isLocked };

  // 2. LOGIQUE DE CALCUL (Après les hooks)
  const theme = darkMode ? darkStyles : lightStyles;
  const isDisconnected = !session || !user || user.email === 'email@domaine.fr';

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
            setIsLoggingOut(true);
            // On laisse un petit délai pour le feedback visuel
            setTimeout(() => {
              signOut();
            }, 200);
          }
        },
      ]
    );
  };

  // Add a useEffect to handle notification toggling
  useEffect(() => {
    const toggleNotifications = async () => {
      if (notifications) {
        // Logic to enable notifications
        console.log('Notifications enabled');
        // Add your notification enabling logic here
      } else {
        // Logic to disable notifications
        console.log('Notifications disabled');
        // Add your notification disabling logic here
      }
    };

    toggleNotifications();
  }, [notifications]);

  // 3. UN SEUL RETURN UNIQUE (Pas de if/return au milieu)
  return (
    <SafeAreaView style={[theme.safeArea]} edges={['top']}>
      {isDisconnected ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={darkMode ? '#fff' : '#3B82F6'} />
          <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 18, marginTop: 10 }}>
            Déconnexion en cours...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={theme.container}>
          <View style={theme.header}>
            <Text style={theme.title}>Mon Profil</Text>
          </View>

          {/* Section Infos Utilisateur */}
          <View style={theme.userInfoSection}>
            <View style={theme.avatarContainer}>
              <Text style={theme.avatarText}>
                {user?.username ? user.username.substring(0, 2).toUpperCase() : '??'}
              </Text>
            </View>
            <Text style={theme.username}>{user?.username || 'Utilisateur'}</Text>
            <Text style={theme.email}>{user?.email || 'email@domaine.fr'}</Text>
            {session && (
              <View style={theme.badgeContainer}>
                <Text style={theme.badgeText}>Connecté • Sécurisé</Text>
              </View>
            )}
            {session && apiChoice === 'OnPremises' && currentSite && (
              <View style={[theme.badgeContainer, { marginTop: 6, backgroundColor: darkMode ? '#1e3a5f' : '#DBEAFE' }]}>
                <Text style={[theme.badgeText, { color: darkMode ? '#93C5FD' : '#1d4ed8' }]}>
                  📍 Site: {currentSite}
                </Text>
              </View>
            )}
            {session && apiChoice === 'Cloud' && (
              <View style={[theme.badgeContainer, { marginTop: 6, backgroundColor: darkMode ? '#1e3a5f' : '#DBEAFE' }]}>
                <Text style={[theme.badgeText, { color: darkMode ? '#93C5FD' : '#1d4ed8' }]}>
                  ☁️ Cloud
                </Text>
              </View>
            )}
          </View>

          {/* Section Préférences */}
          <View style={theme.section}>
            <Text style={theme.sectionTitle}>Préférences</Text>
            
            <View style={theme.row}>
              <View style={theme.rowIconBg}><Text>🔔</Text></View>
              <Text style={theme.rowLabel}>Notifications</Text>
              <Switch value={notifications} onValueChange={setNotifications} trackColor={{false: '#D1D5DB', true: '#3B82F6'}} />
            </View>

            <View style={theme.row}>
              <View style={theme.rowIconBg}><Text>🌙</Text></View>
              <Text style={theme.rowLabel}>Mode Sombre</Text>
              <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{false: '#D1D5DB', true: '#3B82F6'}} />
            </View>
          </View>

          {/* Bouton Déconnexion */}
          <TouchableOpacity
            style={[theme.logoutButton, isLoggingOut && { opacity: 0.7 }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={darkMode ? '#FECACA' : '#DC2626'} />
            ) : (
              <Text style={theme.logoutText}>Se déconnecter</Text>
            )}
          </TouchableOpacity>

          <View style={theme.footer}>
            <Text style={theme.footerText}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Thèmes clair et sombre
const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  userInfoSection: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3
  },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 4, borderColor: '#FFFFFF'
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#3B82F6' },
  username: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  badgeContainer: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#166534', fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 16, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  rowIconBg: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  rowLabel: { flex: 1, fontSize: 16, color: '#374151', fontWeight: '500' },
  logoutButton: {
    backgroundColor: '#FEE2E2', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#FECACA'
  },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
  footer: { alignItems: 'center' },
  footerText: { color: '#9CA3AF', fontSize: 12 },
  
  // Debug styles
  debugHeader: {
    padding: 5,
    marginBottom: 10,
  },
  debugContent: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  debugDetail: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'monospace',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  debugButton: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

const darkStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18181B' },
  container: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F3F4F6' },
  userInfoSection: {
    backgroundColor: '#27272A', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3
  },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#23232b',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 4, borderColor: '#27272A'
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#60A5FA' },
  username: { fontSize: 20, fontWeight: 'bold', color: '#F3F4F6', marginBottom: 4 },
  email: { fontSize: 14, color: '#A1A1AA', marginBottom: 12 },
  badgeContainer: { backgroundColor: '#166534', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#DCFCE7', fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#23232b', borderRadius: 20, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#A1A1AA', marginBottom: 16, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  rowIconBg: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#27272A',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  rowLabel: { flex: 1, fontSize: 16, color: '#F3F4F6', fontWeight: '500' },
  logoutButton: {
    backgroundColor: '#7f1d1d', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#991b1b'
  },
  logoutText: { color: '#FECACA', fontSize: 16, fontWeight: 'bold' },
  footer: { alignItems: 'center' },
  footerText: { color: '#A1A1AA', fontSize: 12 },
  
  // Debug styles
  debugHeader: {
    padding: 5,
    marginBottom: 10,
  },
  debugContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginTop: 8,
    marginBottom: 4,
  },
  debugDetail: {
    fontSize: 10,
    color: '#A1A1AA',
    fontFamily: 'monospace',
    backgroundColor: '#27272A',
    padding: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  debugButton: {
    backgroundColor: '#60A5FA',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});