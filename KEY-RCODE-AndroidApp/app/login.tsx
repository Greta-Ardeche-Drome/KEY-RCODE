import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from "./UserContext"; // Nouvelle importation
import { useRouter } from "expo-router";

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn } = useSession(); // Utilisation du contexte global
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    
    try {
      // --- DÉBUT LOGIQUE BACKEND ---
      // Remplacer ceci par votre vrai fetch vers le serveur .NET/LDAP
      // const response = await fetch('https://votre-api-secure.com/auth/login', { ... });
      // const data = await response.json();
      
      // Simulation de réussite pour tester :
      const fakeToken = "jwt_token_secure_exemple_123456"; 
      
      if (fakeToken) {
        // C'est ICI que la magie opère.
        // signIn va sauvegarder le token et _layout.tsx va détecter le changement
        // et rediriger automatiquement vers Home.
        signIn(fakeToken, {
          username: username,
          email: `${username}@${domain || 'domaine.local'}`,
          domain: domain || 'Defaut'
        });
      }
      // --- FIN LOGIQUE BACKEND ---

    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Identifiez-vous pour accéder au service</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Utilisateur</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Domaine (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="EX: MONDOMAINE"
                value={domain}
                onChangeText={setDomain}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Se souvenir de moi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.securityInfo}>
            <Text style={styles.securityText}>🔒 Connexion sécurisée LDAP</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  contentContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  form: { gap: 20 },
  inputContainer: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  passwordInput: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1F2937' },
  eyeIcon: { fontSize: 18 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center'
  },
  checkboxChecked: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  rememberText: { fontSize: 14, color: '#6B7280' },
  forgotButton: { padding: 4 },
  forgotText: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  loginButton: {
    backgroundColor: '#3B82F6', height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, marginTop: 8
  },
  loginButtonDisabled: { backgroundColor: '#93C5FD' },
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  securityInfo: { marginTop: 32, alignItems: 'center' },
  securityText: { color: '#059669', fontSize: 14, fontWeight: '500' }
});