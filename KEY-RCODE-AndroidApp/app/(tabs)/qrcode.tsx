import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSession } from ".././UserContext";
import { useRouter, usePathname } from "expo-router";
import { useDarkMode } from '../DarkModeContext'; // Corrected import
import EmergencyService from '../services/emergencyService';

type QRCodeGeneratorProps = {
  token: string;
};

// --- COMPOSANT: Générateur de QR Code ---
const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ token }) => {
  // On récupère le mode sombre et on choisit la bonne feuille de style
  const { darkMode } = useDarkMode();
  const styles = darkMode ? darkStyles : lightStyles;

  if (!token) {
    return (
      <View style={styles.qrPlaceholder}>
        <Text style={styles.placeholderText}>
          Appuyez sur le bouton pour générer votre QR Code
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.qrContainer}>
      <View style={styles.qrWrapper}>
        {/* On force le QR Code en noir sur fond blanc pour qu'il soit toujours bien scannable */}
        <QRCode
          value={token}
          size={220}
          color="#000000"
          backgroundColor="#FFFFFF"
        />
      </View>
      <Text style={styles.tokenText}>Token: {token}</Text>
    </View>
  );
};

// --- COMPOSANT PRINCIPAL: Page Details ---
export default function Details() {

  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { session, user, currentApiUrl, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { darkMode } = useDarkMode();
  const styles = darkMode ? darkStyles : lightStyles;

  useEffect(() => {
    if ((!session || !user || user.email === 'email@domaine.fr') && pathname !== '/login') {
      router.replace('/login');
    }
  }, [session, user, pathname]);

  const isDisconnected = !session || !user || user.email === 'email@domaine.fr';

  const generateToken = async () => {
    setIsLoading(true);
    try {
      const payload = {
        userId: user?.email ?? '' 
      };
      const response = await fetch(`${currentApiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        const data = await response.json();
        if (EmergencyService.handleLockError(data, signOut)) {
          return;
        }
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
      } else {
        Alert.alert("Erreur", data.message || "Le serveur a refusé la demande.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur Réseau", "Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      // 2. On envoie l'ordre d'ouverture au serveur
      // IP DU SERVEUR A REMPLACER CI-DESSOUS !
      const response = await fetch(`${currentApiUrl}/open-door`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`,
        },
        body: JSON.stringify({ 
          userId: user?.email ?? '',
          action: 'exit' 
        }),
      });

      if (response.status === 403) {
        const data = await response.json();
        if (EmergencyService.handleLockError(data, signOut)) {
          return;
        }
      }

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sortie autorisée", "La porte est ouverte. Au revoir ! 👋");
      } else {
        Alert.alert("Erreur", "Impossible d'ouvrir la porte automatiquement.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur Réseau", "Impossible de contacter le serveur pour l'ouverture.");
    } finally {
      setToken('');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDisconnected ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: styles.safeArea?.backgroundColor || '#fff' }}>
          <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 18 }}>Déconnexion en cours...</Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* En-tête */}
          <View style={styles.header}>
            <Text style={styles.title}>Générateur de QR Code</Text>
            <Text style={styles.subtitle}>
              Cliquez et Générez votre QR Code
            </Text>
          </View>

          {/* Zone QR Code */}
          <QRCodeGenerator token={token} />

          {/* Boutons d'action */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={generateToken}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>✨ Générer un QR Code</Text>
              )}
            </TouchableOpacity>

            {token && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={disconnect}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>🔄 Sortie</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// --- STYLES CLAIRS ---
const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#528CFF', textAlign: 'center' },
  qrContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  qrWrapper: {
    padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#32CF75',
    shadowOffset: { width: 1, height: 8 }, shadowOpacity: 0.3, shadowRadius: 22, elevation: 10,
  },
  qrPlaceholder: {
    width: 260, height: 260, backgroundColor: '#E4E4E4', borderRadius: 20, justifyContent: 'center',
    alignItems: 'center', padding: 30, borderWidth: 2, borderColor: '#000000', borderStyle: 'dashed',
  },
  placeholderText: { fontSize: 16, color: '#9CA3AF', textAlign: 'center', lineHeight: 24 },
  tokenText: {
    marginTop: 20, fontSize: 12, color: '#32CF75', fontFamily: 'monospace',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, overflow: 'hidden',
  },
  buttonContainer: { width: '100%', gap: 12 },
  button: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButton: {
    backgroundColor: '#32CF75', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  secondaryButton: { backgroundColor: '#FF0000', borderWidth: 2, borderColor: '#E5E7EB' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

// --- STYLES SOMBRES ---
const darkStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F3F4F6', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#60A5FA', textAlign: 'center' },
  qrContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  qrWrapper: {
    padding: 20, backgroundColor: '#FFFFFF', /* Le fond du QR reste blanc pour qu'il soit lisible */
    borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 1, height: 8 }, 
    shadowOpacity: 0.5, shadowRadius: 22, elevation: 10,
  },
  qrPlaceholder: {
    width: 260, height: 260, backgroundColor: '#374151', borderRadius: 20, justifyContent: 'center',
    alignItems: 'center', padding: 30, borderWidth: 2, borderColor: '#4B5563', borderStyle: 'dashed',
  },
  placeholderText: { fontSize: 16, color: '#D1D5DB', textAlign: 'center', lineHeight: 24 },
  tokenText: {
    marginTop: 20, fontSize: 12, color: '#4ADE80', fontFamily: 'monospace',
    backgroundColor: '#374151', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, overflow: 'hidden',
  },
  buttonContainer: { width: '100%', gap: 12 },
  button: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButton: {
    backgroundColor: '#22C55E', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  secondaryButton: { backgroundColor: '#7F1D1D', borderWidth: 2, borderColor: '#991B1B' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButtonText: { color: '#FECACA', fontSize: 16, fontWeight: '600' },
});