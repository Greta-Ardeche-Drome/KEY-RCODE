import React, { useState, useEffect } from 'react';
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
import { useSession } from "./UserContext";
import { useRouter } from "expo-router";

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { signIn, session, user } = useSession(); // Utilisation du contexte global
  const router = useRouter();

  useEffect(() => {
    if (session && user && user.email !== 'email@domaine.fr') {
      router.replace('/(tabs)/home');
    }
  }, [session, user]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      // --- APPEL RÉEL AU BACKEND LDAP ---
      const response = await fetch('http://192.168.1.13:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || "Identifiants invalides");
      }

      const data = await response.json();
      const token = data.token;

      if (token) {
        signIn(token, {
          username: username,
          email: `${username}@KRC`,
          domain: 'KRC'
        });
      } else {
        throw new Error("Token manquant dans la réponse");
      }
      // --- FIN APPEL RÉEL ---

    } catch (error: any) {
      console.error(error);
      Alert.alert('Erreur', error.message || 'Impossible de se connecter au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={[styles.contentContainer]}>
          {/* Icône mode jour/nuit */}
          <View style={styles.themeToggleContainer}>
            <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)}>
              <Text style={styles.themeToggleIcon}>
                {isDarkMode ? '🌙' : '🌞'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Connexion</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>Identifiez-vous pour accéder au service</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.label }]}>Utilisateur</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.inputText, borderColor: theme.inputBorder }]}
                placeholder="Nom d'utilisateur"
                placeholderTextColor={theme.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.label }]}>Mot de passe</Text>
              <View style={[styles.passwordContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.inputText }]}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={theme.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.rememberText, { color: theme.label }]}>Se souvenir de moi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[
                styles.loginButton, 
                isLoading && styles.loginButtonDisabled,
                { backgroundColor: isLoading ? theme.buttonDisabled : theme.button }
              ]}
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
            <Text style={[styles.securityText, { color: theme.security }]}>🔒 Connexion sécurisée et chiffrée vers nos serveurs</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Thèmes jour/nuit
const lightTheme = {
  background: '#FFFFFF',
  text: '#1F2937',
  subtext: '#6B7280',
  label: '#374151',
  inputBg: '#F9FAFB',
  inputText: '#1F2937',
  inputBorder: '#E5E7EB',
  placeholder: '#9CA3AF',
  button: '#3B82F6',
  buttonDisabled: '#93C5FD',
  security: '#059669'
};

const darkTheme = {
  background: '#18181B',
  text: '#F3F4F6',
  subtext: '#A1A1AA',
  label: '#E5E7EB',
  inputBg: '#27272A',
  inputText: '#F3F4F6',
  inputBorder: '#52525B',
  placeholder: '#A1A1AA',
  button: '#2563EB',
  buttonDisabled: '#334155',
  security: '#34D399'
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  contentContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  themeToggleContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    padding: 8,
    margin: 8,
  },
  themeToggleIcon: {
    fontSize: 28,
  },
  header: { marginBottom: 32, marginTop: 32 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  form: { gap: 20 },
  inputContainer: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  passwordInput: { flex: 1, paddingVertical: 16, fontSize: 16 },
  eyeIcon: { fontSize: 18 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center'
  },
  checkboxChecked: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  rememberText: { fontSize: 14 },
  forgotButton: { padding: 4 },
  forgotText: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  loginButton: {
    height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, marginTop: 8
  },
  loginButtonDisabled: {},
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  securityInfo: { marginTop: 32, alignItems: 'center' },
  securityText: { fontSize: 14, fontWeight: '500' }
});