import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, usePathname } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../assets/images/keyrcode-logo.png';
import { useSession } from "../UserContext";
import { useDarkMode } from '../DarkModeContext';

export default function Home() {
  // 1. TOUS LES HOOKS EN PREMIER (Ordre immuable)
  const router = useRouter();
  const { session, user, currentApiUrl, checkLockStatus, currentSite, apiChoice } = useSession();
  const pathname = usePathname();
  const { darkMode } = useDarkMode(); 
  const [emergencyStep, setEmergencyStep] = React.useState(0);
  const [emergencyLoading, setEmergencyLoading] = React.useState(false);

  // 2. VARIABLES ET LOGIQUE
  // Choix des styles en fonction du mode sombre
  const styles = darkMode ? darkStyles : lightStyles;

  useEffect(() => {
    if ((!session || !user || user.email === 'email@domaine.fr') && pathname !== '/login') {
      router.replace('/login');
    } else if (session && user && user.email !== 'email@domaine.fr') {
      // Vérifier le statut de verrouillage lors du chargement
      checkLockStatus();
    }
  }, [session, user, pathname, checkLockStatus]);

  // 3. EARLY RETURN (Après les hooks)
  if (!session || !user || user.email === 'email@domaine.fr') {
    // On attend la redirection, on peut afficher un écran vide ou un loader
    return <View style={{ flex: 1, backgroundColor: styles.container.backgroundColor }} />;
  }

  // 4. FONCTIONS
  const sendEmergencyRequest = async () => {
    setEmergencyLoading(true);
    try {
      const response = await fetch(`${currentApiUrl}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user?.email ?? 'Utilisateur Inconnu' }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert('🚨 Urgence signalée ! Portes Ouvertes.');
      } else {
        alert(data.message || "Erreur lors de la demande d'urgence.");
      }
    } catch (error) {
      alert('Erreur réseau : impossible de contacter le serveur.');
    } finally {
      setEmergencyStep(0);
      setEmergencyLoading(false);
    }
  };

  const handleEmergencyPress = () => {
    if (emergencyStep === 0) {
      setEmergencyStep(1);
      setTimeout(() => setEmergencyStep(0), 5000); // Reset after 5s if not confirmed
      return;
    }
    // Show confirmation popup
    if (emergencyStep === 1) {
      Alert.alert(
        'Confirmer Urgence',
        'Êtes-vous sûr de vouloir signaler une urgence ?',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => setEmergencyStep(0) },
          { text: 'Oui', style: 'destructive', onPress: sendEmergencyRequest },
        ]
      );
    }
  };

  // 5. RENDU PRINCIPAL
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={Logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>KEY-RCODE</Text>
          <Text style={styles.subtitle}>Votre application d'accès sécurisé par QR Code</Text>
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userText}>
                {user.username} {user.role === 'admin' && '• Admin'}
              </Text>
              <Text style={styles.groupText}>Groupe: {user.ldapGroup}</Text>
              {apiChoice === 'OnPremises' && currentSite && (
                <Text style={styles.groupText}>📍 Site: {currentSite}</Text>
              )}
              {apiChoice === 'Cloud' && (
                <Text style={styles.groupText}>☁️ Cloud</Text>
              )}
            </View>
          )}
        </View>

        {/* Main Action */}
        <View style={styles.content}>
          <View style={styles.mainCard}>
            <Text style={styles.mainIcon}>📱</Text>
            <Text style={styles.mainTitle}>Générer un QR Code</Text>
            <Text style={styles.mainDescription}>
              Créez instantanément votre QR code personnalisé
            </Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/qrcode')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>✨ Commencer</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Links */}
          <View style={styles.quickLinks}>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', opacity: emergencyLoading ? 0.7 : 1 }]}
              onPress={handleEmergencyPress}
              disabled={emergencyLoading}
            >
              <Text style={[styles.linkIcon, { color: '#fff' }]}>🚨</Text>
              <Text style={[styles.linkText, { color: '#fff' }]}>{emergencyStep === 1 ? 'Appuyez encore !' : 'Urgence'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.linkIcon}>⚙️</Text>
              <Text style={styles.linkText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- STYLES CLAIRS ---
const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#3f82f5', paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#007d77',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5, letterSpacing: 1 },
  subtitle: { fontSize: 15, color: '#E0E7FF' },
  userInfo: { marginTop: 10, alignItems: 'center' },
  userText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  groupText: { fontSize: 12, color: '#E0E7FF', marginTop: 2 },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  mainCard: {
    backgroundColor: '#FFFFFF', borderRadius: 25, padding: 30, alignItems: 'center', marginBottom: 25,marginTop: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  mainIcon: { fontSize: 80, marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 10, textAlign: 'center' },
  mainDescription: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  primaryButton: {
    backgroundColor: '#32cf75', paddingVertical: 5, paddingHorizontal: 50, borderRadius: 15,
    shadowColor: '#007d77', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  quickLinks: { flexDirection: 'row', gap: 15 },
  linkButton: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 15, padding: 20, alignItems: 'center',
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  linkIcon: { fontSize: 32, marginBottom: 8 },
  linkText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  logo: { width: 160, height: 160, marginBottom: -20 },
});

// --- STYLES SOMBRES ---
const darkStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#1F2937' },
  header: {
    backgroundColor: '#1e3a8a', paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#F3F4F6', marginBottom: 5, letterSpacing: 1 },
  subtitle: { fontSize: 15, color: '#93C5FD' },
  userInfo: { marginTop: 10, alignItems: 'center' },
  userText: { fontSize: 14, color: '#F3F4F6', fontWeight: '600' },
  groupText: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  mainCard: {
    backgroundColor: '#374151', borderRadius: 25, padding: 30, alignItems: 'center', marginBottom: 25, marginTop: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  mainIcon: { fontSize: 80, marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#F3F4F6', marginBottom: 10, textAlign: 'center' },
  mainDescription: { fontSize: 15, color: '#D1D5DB', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  primaryButton: {
    backgroundColor: '#22c55e', paddingVertical: 18, paddingHorizontal: 50, borderRadius: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  quickLinks: { flexDirection: 'row', gap: 15 },
  linkButton: {
    flex: 1, backgroundColor: '#374151', borderRadius: 15, padding: 20, alignItems: 'center',
    borderWidth: 2, borderColor: '#4B5563',
  },
  linkIcon: { fontSize: 32, marginBottom: 8 },
  linkText: { fontSize: 14, fontWeight: '600', color: '#F3F4F6' },
  logo: { width: 160, height: 160, marginBottom: -20 },
});