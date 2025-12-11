import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../assets/images/keyrcode-logo.png';
import { UserProvider } from ".././UserContext";

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={Logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>KEY-RCODE</Text>
          <Text style={styles.subtitle}>Votre générateur de QR Code</Text>
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
              style={styles.linkButton}
              onPress={() => router.push('/(tabs)/qrcode')}
            >
              <Text style={styles.linkIcon}>🎯</Text>
              <Text style={styles.linkText}>Nouveau QR</Text>
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
    backgroundColor: '#3f82f5',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#007d77',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#E0E7FF',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  mainIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  mainDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#32cf75',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 15,
    shadowColor: '#007d77',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 15,
  },
  linkButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  linkIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  logo: {
    width: 160,    // Largeur souhaitée
    height: 160,   // Hauteur souhaitée
    marginBottom: -20,
  },
});