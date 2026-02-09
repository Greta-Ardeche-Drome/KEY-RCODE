import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from "../UserContext"; // Import du contexte global

export default function Profile() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saveHistory, setSaveHistory] = useState(true);

  // Récupération des infos globales
  const { signOut, user, session } = useSession();

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
            signOut(); // Déclenche le nettoyage et la redirection vers Login
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mon Profil</Text>
        </View>

        {/* Section Infos Utilisateur */}
        <View style={styles.userInfoSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.username ? user.username.substring(0, 2).toUpperCase() : '??'}
            </Text>
          </View>
          <Text style={styles.username}>{user?.username || 'Utilisateur'}</Text>
          <Text style={styles.email}>{user?.email || 'email@domaine.fr'}</Text>
          {session && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>Connecté • Sécurisé</Text>
            </View>
          )}
        </View>

        {/* Section Préférences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>
          
          <View style={styles.row}>
            <View style={styles.rowIconBg}><Text>🔔</Text></View>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{false: '#D1D5DB', true: '#3B82F6'}} />
          </View>

          <View style={styles.row}>
            <View style={styles.rowIconBg}><Text>🌙</Text></View>
            <Text style={styles.rowLabel}>Mode Sombre</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{false: '#D1D5DB', true: '#3B82F6'}} />
          </View>

          <View style={styles.row}>
            <View style={styles.rowIconBg}><Text>💾</Text></View>
            <Text style={styles.rowLabel}>Historique local</Text>
            <Switch value={saveHistory} onValueChange={setSaveHistory} trackColor={{false: '#D1D5DB', true: '#3B82F6'}} />
          </View>
        </View>

        {/* Bouton Déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  footerText: { color: '#9CA3AF', fontSize: 12 }
});