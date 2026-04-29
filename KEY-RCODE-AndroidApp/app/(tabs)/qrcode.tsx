import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSession } from ".././UserContext";
import { useRouter, usePathname, useFocusEffect } from "expo-router";
import { useDarkMode } from '../DarkModeContext'; // Corrected import
import EmergencyService from '../services/emergencyService';
import * as Brightness from 'expo-brightness';

const QR_EXPIRY_SECONDS = 300; // 5 minutes

const formatExpiry = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

type QRCodeGeneratorProps = {
  token: string;
  timeLeft: number;
};

// --- COMPOSANT: Générateur de QR Code ---
const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ token, timeLeft }) => {
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

  const isExpiringSoon = timeLeft <= 60;

  return (
    <View style={styles.qrContainer}>
      {/* Bandeau de sécurité */}
      <View style={[styles.lockBanner, isExpiringSoon && styles.lockBannerWarning]}>
        <Text style={styles.lockBannerText}>
          🔒 QR Code Actif — Écran protégé
        </Text>
      </View>
      <View style={styles.qrWrapper}>
        {/* On force le QR Code en noir sur fond blanc pour qu'il soit toujours bien scannable */}
        <QRCode
          value={token}
          size={220}
          color="#000000"
          backgroundColor="#FFFFFF"
        />
      </View>
      {/* Compte à rebours d'expiration */}
      <View style={[styles.expiryBadge, isExpiringSoon && styles.expiryBadgeWarning]}>
        <Text style={[styles.expiryText, isExpiringSoon && styles.expiryTextWarning]}>
          ⏱ Expire dans : {formatExpiry(timeLeft)}
        </Text>
      </View>
    </View>
  );
};

// --- COMPOSANT PRINCIPAL: Page Details ---
export default function Details() {

  const [token, setToken] = useState('');
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [exitConfirm, setExitConfirm] = useState(false);
  const originalBrightness = useRef<number>(-1);
  const { session, user, currentApiUrl, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { darkMode } = useDarkMode();
  const styles = darkMode ? darkStyles : lightStyles;

  useEffect(() => {
    if ((!session || !user) && pathname !== '/login') {
      router.replace('/login');
    }
  }, [session, user, pathname]);

  // Gestion du cooldown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Compte à rebours expiration QR (toutes les 500ms pour précision)
  useEffect(() => {
    if (!tokenExpiresAt) return;
    const timer = setInterval(() => {
      const remaining = Math.ceil((tokenExpiresAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setToken('');
        setTokenExpiresAt(null);
        setTimeLeft(0);
        Brightness.getBrightnessAsync()
          .then(() => {
            if (originalBrightness.current >= 0) {
              Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {});
            }
          })
          .catch(() => {});
        Alert.alert("QR Code expiré", "Votre QR Code a expiré après 5 minutes.");
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [tokenExpiresAt]);

  // Luminosité 100% quand QR actif, restauration à la désactivation
  useEffect(() => {
    if (token) {
      Brightness.getBrightnessAsync()
        .then((b) => {
          originalBrightness.current = b;
          return Brightness.setBrightnessAsync(1.0);
        })
        .catch(() => {});
    } else {
      if (originalBrightness.current >= 0) {
        Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {});
      }
    }
  }, [token]);

  // Expiration automatique du QR si l'utilisateur quitte la page
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (token) {
          setToken('');
          setTokenExpiresAt(null);
          setTimeLeft(0);
          if (originalBrightness.current >= 0) {
            Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {});
          }
        }
      };
    }, [token])
  );

  const isDisconnected = !session || !user;

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
        setTokenExpiresAt(Date.now() + QR_EXPIRY_SECONDS * 1000);
        setTimeLeft(QR_EXPIRY_SECONDS);
        setCooldown(20); // 20 secondes d'attente avant de pouvoir en générer un nouveau
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

  const handleDisconnectPress = () => {
    if (exitConfirm) {
      setExitConfirm(false);
      disconnect();
    } else {
      setExitConfirm(true);
      // Réinitialise la confirmation après 3 secondes si pas de second appui
      setTimeout(() => {
        setExitConfirm(false);
      }, 3000);
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
          <QRCodeGenerator token={token} timeLeft={timeLeft} />

          {/* Boutons d'action */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (isLoading || !!token || cooldown > 0) && { opacity: 0.5 }
              ]}
              onPress={generateToken}
              activeOpacity={0.8}
              disabled={isLoading || !!token || cooldown > 0}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {token
                    ? "QR Code Actif"
                    : cooldown > 0
                      ? `Attendre ${cooldown}s`
                      : "✨ Générer un QR Code"}
                </Text>
              )}
            </TouchableOpacity>

            {token && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.secondaryButton,
                  exitConfirm && { backgroundColor: '#991B1B', borderColor: '#7F1D1D' }
                ]}
                onPress={handleDisconnectPress}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>
                  {exitConfirm ? "⚠️ Confirmer Sortie ?" : "🔄 Sortie"}
                </Text>
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
  lockBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16,
    marginBottom: 12, width: '100%',
  },
  lockBannerWarning: { backgroundColor: '#F59E0B' },
  lockBannerText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  expiryBadge: {
    marginTop: 14, backgroundColor: '#ECFDF5', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: '#22C55E',
  },
  expiryBadgeWarning: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  expiryText: { fontSize: 14, color: '#15803D', fontWeight: '600' },
  expiryTextWarning: { color: '#92400E' },
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
  lockBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16,
    marginBottom: 12, width: '100%',
  },
  lockBannerWarning: { backgroundColor: '#B45309' },
  lockBannerText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  expiryBadge: {
    marginTop: 14, backgroundColor: '#14532D', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: '#16A34A',
  },
  expiryBadgeWarning: { backgroundColor: '#78350F', borderColor: '#B45309' },
  expiryText: { fontSize: 14, color: '#4ADE80', fontWeight: '600' },
  expiryTextWarning: { color: '#FCD34D' },
});