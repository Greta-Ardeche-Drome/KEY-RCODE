import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Animated } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSession } from ".././UserContext";
import { useRouter, usePathname } from "expo-router";
import { useDarkMode } from '../DarkModeContext';
import EmergencyService from '../services/emergencyService';

const TOKEN_DURATION = 300; // 5 minutes

type QRCodeGeneratorProps = {
  token: string;
  borderAnim: Animated.Value;
  timeLeft: number;
};

// --- COMPOSANT: Générateur de QR Code ---
const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ token, borderAnim, timeLeft }) => {
  const { darkMode } = useDarkMode();
  const styles = darkMode ? darkStyles : lightStyles;

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 60, 120, 180, TOKEN_DURATION],
    outputRange: ['#EF4444', '#EF4444', '#F97316', '#EAB308', '#32CF75'],
  });

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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
      <Animated.View style={[styles.qrWrapper, { borderWidth: 4, borderColor: animatedBorderColor }]}>
        <QRCode
          value={token}
          size={220}
          color="#000000"
          backgroundColor="#FFFFFF"
        />
      </Animated.View>
      <Animated.Text style={[styles.timerText, { color: animatedBorderColor }]}>
        ⏱ {formatTime(timeLeft)}
      </Animated.Text>
    </View>
  );
};

// --- COMPOSANT PRINCIPAL: Page Details ---
export default function Details() {

  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOKEN_DURATION);
  const borderAnim = useRef(new Animated.Value(TOKEN_DURATION)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Animation du contour et countdown quand un token est actif
  useEffect(() => {
    if (token) {
      borderAnim.setValue(TOKEN_DURATION);
      setTimeLeft(TOKEN_DURATION);

      Animated.timing(borderAnim, {
        toValue: 0,
        duration: TOKEN_DURATION * 1000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setToken('');
          Alert.alert('QR Code expiré', 'Votre QR code n\'est plus valide. Générez-en un nouveau.');
        }
      });

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      borderAnim.stopAnimation();
      borderAnim.setValue(TOKEN_DURATION);
      setTimeLeft(TOKEN_DURATION);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [token]);

  const isDisconnected = !session || !user;

  const generateToken = async () => {
    setIsLoading(true);
    try {
      const payload = {
        userId: user?.username ?? ''
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
        setCooldown(20);
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
      const response = await fetch(`${currentApiUrl}/relay/exit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`,
        },
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
      } else if (response.status === 404) {
        Alert.alert(
          "Aucune entrée connue",
          "Approchez-vous du lecteur et scannez d'abord votre QR code pour entrer."
        );
      } else {
        Alert.alert("Erreur", data.message || "Impossible d'ouvrir la porte automatiquement.");
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
          <QRCodeGenerator token={token} borderAnim={borderAnim} timeLeft={timeLeft} />

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
  timerText: { marginTop: 16, fontSize: 18, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1 },
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
    padding: 20, backgroundColor: '#FFFFFF',
    borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 1, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 22, elevation: 10,
  },
  qrPlaceholder: {
    width: 260, height: 260, backgroundColor: '#374151', borderRadius: 20, justifyContent: 'center',
    alignItems: 'center', padding: 30, borderWidth: 2, borderColor: '#4B5563', borderStyle: 'dashed',
  },
  placeholderText: { fontSize: 16, color: '#D1D5DB', textAlign: 'center', lineHeight: 24 },
  timerText: { marginTop: 16, fontSize: 18, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1 },
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
