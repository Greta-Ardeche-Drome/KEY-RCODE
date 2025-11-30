import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { UserProvider } from ".././UserContext";

type QRCodeGeneratorProps = {
  token: string;
};

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ token }) => {
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
export default function Details() {
  const [token, setToken] = useState('');
  // Exemple : ID utilisateur statique ou récupéré depuis un contexte
  const userId = "001"; // Remplace par la récupération réelle de l'ID utilisateur

  const generateToken = () => {
    const timestamp = Date.now();
    // Inclut l'ID utilisateur dans le token
    setToken(`TOKEN_KRC-${timestamp}-UID${userId}`);
  };

  const resetToken = () => {
    setToken('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Générateur de QR Code</Text>
          <Text style={styles.subtitle}>
            Créez votre QR Code personnalisé en un clic
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
          >
            <Text style={styles.buttonText}>✨ Générer un QR Code</Text>
          </TouchableOpacity>

          {token && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={resetToken}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>🔄 Réinitialiser</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#528cffff',
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#ffffffff',
    borderRadius: 20,
    shadowColor: '#32cf75',
    shadowOffset: {
      width: 1,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 10,
  },
  qrPlaceholder: {
    width: 260,
    height: 260,
    backgroundColor: '#e4e4e4ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    borderWidth: 2,
    borderColor: '#000000ff',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  tokenText: {
    marginTop: 20,
    fontSize: 12,
    color: '#32cf75',
    fontFamily: 'monospace',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#32cf75',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: '#818dffff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    color: '#ffffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#ffffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});