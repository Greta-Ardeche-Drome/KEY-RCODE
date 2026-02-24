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
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from "./UserContext";
import { API_URLS, KNOWN_SITES, SiteConfig, probeOnPremisesSite, autoDetectSites, resolveOnPremisesUrl } from './config';
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [apiChoice, setApiChoice] = useState<'OnPremises' | 'Cloud'>('OnPremises');

  // ── Site On-Premises ──────────────────────────────────────────
  const [selectedSite, setSelectedSite] = useState<SiteConfig | null>(KNOWN_SITES[0] || null);
  const [showSitePicker, setShowSitePicker] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [customSiteName, setCustomSiteName] = useState('');
  const [detectedSites, setDetectedSites] = useState<Array<SiteConfig & { latencyMs: number }>>([]);

  const { signIn, session, user } = useSession(); // Utilisation du contexte global
  const router = useRouter();

  // ── Remember Me Logic ──────────────────────────────────
  useEffect(() => {
    // Charger les identifiants sauvegardés au démarrage
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedData = await SecureStore.getItemAsync('krc_remember_credentials');
      if (savedData) {
        const { username: savedUsername, apiChoice: savedApiChoice, rememberMe: savedRemember } = JSON.parse(savedData);
        if (savedRemember) {
          setUsername(savedUsername || '');
          setApiChoice(savedApiChoice || 'OnPremises');
          setRememberMe(true);
        }
      }
    } catch (error) {
      // Erreur silencieuse
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe && username) {
        await SecureStore.setItemAsync('krc_remember_credentials', JSON.stringify({
          username,
          apiChoice,
          rememberMe: true,
        }));
      } else {
        await SecureStore.deleteItemAsync('krc_remember_credentials');
      }
    } catch (error) {
      // Erreur silencieuse
    }
  };
  // ──────────────────────────────────────────────────

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

    // Vérifier qu'un site est sélectionné en mode OnPremises
    if (apiChoice === 'OnPremises' && !selectedSite) {
      Alert.alert('Erreur', 'Veuillez sélectionner un site On-Premises');
      return;
    }

    setIsLoading(true);

    try {
      // Résolution de l'URL selon le choix API + site
      const loginUrl = apiChoice === 'Cloud'
        ? `${API_URLS.Cloud}/auth/login`
        : `${resolveOnPremisesUrl(selectedSite!.name)}/auth/login`;

      const response = await fetch(loginUrl, {
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
        // Extraction des informations utilisateur depuis la réponse
        
        // Gestion robuste de l'email
        let userEmail = data.user?.email || `${username}@KRC`;
        if (Array.isArray(userEmail)) {
          userEmail = userEmail[0] || `${username}@KRC`;
        }
        
        // Détection admin plus robuste
        const rawLdapGroups = data.user?.ldapGroups || data.user?.groups || [];
        // LDAP peut retourner une chaîne si un seul groupe, ou un tableau si plusieurs
        const ldapGroups = Array.isArray(rawLdapGroups) ? rawLdapGroups : [rawLdapGroups];
        
        const isAdminUser = username.toLowerCase() === 'administrateur' || 
                           ldapGroups.some((group: string) => 
                             group.toLowerCase().includes('admin') || 
                             group.toLowerCase().includes('administrator')
                           ) ||
                           data.user?.role === 'admin';

        // Extraction du site depuis les groupes LDAP (DL_KRC_Users_{site})
        const siteFromLdap = ldapGroups.reduce((found: string | undefined, group: string) => {
          if (found) return found;
          const match = group.match(/DL_KRC_(?:Users|Admins)_(.+)/i);
          return match ? match[1] : undefined;
        }, undefined);

        const userData = {
          username: username,
          email: userEmail,
          domain: data.user?.domain || 'KRC',
          role: isAdminUser ? 'admin' as const : 'user' as const,
          ldapGroup: Array.isArray(ldapGroups) && ldapGroups.length > 0 
            ? ldapGroups[0] 
            : (data.user?.group || data.user?.ldapGroup || `DL_KRC_Users_${siteFromLdap || selectedSite?.name || 'DefaultSite'}`),
          site: siteFromLdap || (apiChoice === 'OnPremises' ? selectedSite?.name : undefined),
        };

        signIn(token, userData, apiChoice, apiChoice === 'OnPremises' ? selectedSite?.name : undefined);
        
        // ✅ Sauvegarder les identifiants si Remember Me
        await saveCredentials();
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

          {/* Choix API OnPremises/Cloud */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
            <TouchableOpacity
              style={{
                paddingVertical: 8,
                paddingHorizontal: 20,
                borderRadius: 20,
                marginHorizontal: 8,
                backgroundColor: apiChoice === 'OnPremises' ? '#2563eb' : theme.inputBg,
                borderWidth: 1,
                borderColor: apiChoice === 'OnPremises' ? '#2563eb' : theme.inputBorder,
              }}
              onPress={() => setApiChoice('OnPremises')}
            >
              <Text style={{ color: apiChoice === 'OnPremises' ? '#fff' : theme.text, fontWeight: 'bold' }}>🏢 OnPremises</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingVertical: 8,
                paddingHorizontal: 20,
                borderRadius: 20,
                marginHorizontal: 8,
                backgroundColor: apiChoice === 'Cloud' ? '#2563eb' : theme.inputBg,
                borderWidth: 1,
                borderColor: apiChoice === 'Cloud' ? '#2563eb' : theme.inputBorder,
              }}
              onPress={() => setApiChoice('Cloud')}
            >
              <Text style={{ color: apiChoice === 'Cloud' ? '#fff' : theme.text, fontWeight: 'bold' }}>☁️ Cloud</Text>
            </TouchableOpacity>
          </View>

          {/* ── Sélecteur de site On-Premises ────────────────────── */}
          {apiChoice === 'OnPremises' && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.label, { color: theme.label, marginBottom: 8, textAlign: 'center' }]}>
                📍 Site On-Premises
              </Text>

              {/* Bouton d'ouverture du sélecteur */}
              <TouchableOpacity
                style={{
                  backgroundColor: theme.inputBg,
                  borderWidth: 1,
                  borderColor: selectedSite ? '#2563eb' : theme.inputBorder,
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => setShowSitePicker(true)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>
                    {selectedSite ? `🏢 ${selectedSite.name}` : 'Sélectionner un site…'}
                  </Text>
                  {selectedSite?.description && (
                    <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 2 }}>
                      {selectedSite.description}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 18, color: theme.subtext }}>▼</Text>
              </TouchableOpacity>

              {/* Indicateur de probe */}
              {probeResult && (
                <Text style={{
                  textAlign: 'center',
                  marginTop: 6,
                  fontSize: 12,
                  color: probeResult.startsWith('✅') ? '#059669' : 
                         probeResult.includes('DNS OK') ? '#f59e0b' : 
                         '#dc2626',
                }}>
                  {probeResult}
                </Text>
              )}

              {/* Bouton auto-détection */}
              <TouchableOpacity
                style={{
                  marginTop: 8,
                  alignItems: 'center',
                  paddingVertical: 6,
                }}
                onPress={async () => {
                  setIsProbing(true);
                  setProbeResult(null);
                  try {
                    const reachable = await autoDetectSites(4000);
                    setDetectedSites(reachable);
                    if (reachable.length > 0) {
                      setSelectedSite(reachable[0]);
                      setProbeResult(`✅ ${reachable.length} site(s) détecté(s) – ${reachable[0].name} sélectionné (${reachable[0].latencyMs}ms)`);
                    } else {
                      setProbeResult('⚠️ Aucun serveur joignable. Vérifiez votre réseau local.');
                    }
                  } catch (error) {
                    console.error('❌ Erreur auto-détection:', error);
                    setProbeResult('❌ Erreur lors de la détection automatique.');
                  } finally {
                    setIsProbing(false);
                  }
                }}
                disabled={isProbing}
              >
                {isProbing ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <Text style={{ color: '#2563eb', fontSize: 13, fontWeight: '600' }}>
                    🔍 Auto-détection des sites
                  </Text>
                )}
              </TouchableOpacity>

              {/* ── Modal Site Picker ─────────────────────────────── */}
              <Modal
                visible={showSitePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSitePicker(false)}
              >
                <View style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'flex-end',
                }}>
                  <View style={{
                    backgroundColor: isDarkMode ? '#1e1e2e' : '#ffffff',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: 20,
                    maxHeight: '60%',
                  }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: theme.text,
                      marginBottom: 16,
                      textAlign: 'center',
                    }}>
                      Sélection du site
                    </Text>

                    {/* Sites connus */}
                    <FlatList
                      data={KNOWN_SITES}
                      keyExtractor={(item) => item.name}
                      renderItem={({ item }) => {
                        const isSelected = selectedSite?.name === item.name;
                        const detected = detectedSites.find(d => d.name === item.name);
                        return (
                          <TouchableOpacity
                            style={{
                              backgroundColor: isSelected ? '#2563eb20' : 'transparent',
                              borderWidth: 1,
                              borderColor: isSelected ? '#2563eb' : (isDarkMode ? '#333' : '#e5e7eb'),
                              borderRadius: 12,
                              padding: 14,
                              marginBottom: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                            onPress={async () => {
                              setSelectedSite(item);
                              setShowSitePicker(false);
                              // Probe automatique
                              setIsProbing(true);
                              setProbeResult(null);
                              const probe = await probeOnPremisesSite(item.name);
                              setIsProbing(false);
                              if (probe.reachable) {
                                setProbeResult(`✅ ${item.name} joignable (${probe.latencyMs}ms)`);
                              } else {
                                // Messages différenciés selon le type d'erreur
                                if (!probe.dnsResolved || probe.errorType === 'DNS_ERROR') {
                                  setProbeResult(`❌ ${item.name} : résolution DNS échouée`);
                                } else if (probe.errorType === 'TIMEOUT') {
                                  setProbeResult(`⏱️ ${item.name} : DNS OK mais timeout de connexion`);
                                } else if (probe.errorType === 'CONNECTION_REFUSED') {
                                  setProbeResult(`🔒 ${item.name} : DNS OK mais connexion refusée (serveur éteint ?)`);
                                } else if (probe.errorType === 'HTTP 404') {
                                  setProbeResult(`⚠️ ${item.name} : serveur OK mais endpoint /health manquant`);
                                } else if (probe.errorType?.startsWith('HTTP')) {
                                  setProbeResult(`⚠️ ${item.name} : DNS OK mais ${probe.errorType}`);
                                } else {
                                  setProbeResult(`⚠️ ${item.name} : DNS OK mais serveur non joignable`);
                                }
                              }
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>
                                🏢 {item.name}
                              </Text>
                              {item.description && (
                                <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 2 }}>
                                  {item.description}
                                </Text>
                              )}
                              <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>
                                {item.hostname}
                              </Text>
                            </View>
                            {detected && (
                              <Text style={{ color: '#059669', fontSize: 12, fontWeight: '600' }}>
                                {detected.latencyMs}ms ✓
                              </Text>
                            )}
                            {isSelected && (
                              <Text style={{ color: '#2563eb', fontSize: 18, marginLeft: 8 }}>✓</Text>
                            )}
                          </TouchableOpacity>
                        );
                      }}
                      ListEmptyComponent={
                        <Text style={{ color: theme.subtext, textAlign: 'center', padding: 20 }}>
                          Aucun site configuré.{'\n'}Ajoutez des sites dans config.ts
                        </Text>
                      }
                    />

                    {/* Saisie manuelle d'un site personnalisé */}
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: isDarkMode ? '#333' : '#e5e7eb', paddingTop: 12 }}>
                      <Text style={{ color: theme.subtext, fontSize: 12, marginBottom: 6 }}>
                        Ou saisir un nom de site (résolution DNS automatique) :
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TextInput
                          style={{
                            flex: 1,
                            backgroundColor: theme.inputBg,
                            borderWidth: 1,
                            borderColor: theme.inputBorder,
                            borderRadius: 10,
                            padding: 10,
                            color: theme.inputText,
                            fontSize: 14,
                          }}
                          placeholder="ex: Marseille"
                          placeholderTextColor={theme.placeholder}
                          value={customSiteName}
                          onChangeText={setCustomSiteName}
                          autoCapitalize="words"
                        />
                        <TouchableOpacity
                          style={{
                            backgroundColor: customSiteName.trim() ? '#2563eb' : '#94a3b8',
                            borderRadius: 10,
                            paddingHorizontal: 16,
                            justifyContent: 'center',
                          }}
                          disabled={!customSiteName.trim()}
                          onPress={async () => {
                            const siteName = customSiteName.trim();
                            if (!siteName) return;
                            const customSite: SiteConfig = {
                              name: siteName,
                              apiUrl: resolveOnPremisesUrl(siteName),
                              hostname: `${siteName.toLowerCase()}-backend.krc.local`,
                              description: `Site personnalisé – ${siteName}`,
                            };
                            setSelectedSite(customSite);
                            setCustomSiteName('');
                            setShowSitePicker(false);
                            // Probe
                            setIsProbing(true);
                            setProbeResult(null);
                            const probe = await probeOnPremisesSite(siteName);
                            setIsProbing(false);
                            if (probe.reachable) {
                              setProbeResult(`✅ ${siteName} joignable (${probe.latencyMs}ms)`);
                            } else {
                                // Messages différenciés selon le type d'erreur
                                if (!probe.dnsResolved || probe.errorType === 'DNS_ERROR') {
                                  setProbeResult(`❌ ${siteName} : résolution DNS échouée`);
                                } else if (probe.errorType === 'TIMEOUT') {
                                  setProbeResult(`⏱️ ${siteName} : DNS OK mais timeout de connexion (${probe.latencyMs}ms)`);
                                } else if (probe.errorType === 'CONNECTION_REFUSED') {
                                  setProbeResult(`🔒 ${siteName} : DNS OK mais connexion refusée (serveur éteint ?)`);
                                } else if (probe.errorType === 'HTTP 404') {
                                  setProbeResult(`⚠️ ${siteName} : serveur OK mais endpoint /health manquant (${probe.latencyMs}ms)`);
                                } else if (probe.errorType?.startsWith('HTTP')) {
                                  setProbeResult(`⚠️ ${siteName} : DNS OK mais ${probe.errorType} (${probe.latencyMs}ms)`);
                                } else {
                                  setProbeResult(`⚠️ ${siteName} : DNS OK mais serveur non joignable (${probe.latencyMs}ms)`);
                                }
                            }
                          }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600' }}>OK</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Bouton Fermer */}
                    <TouchableOpacity
                      style={{
                        marginTop: 16,
                        paddingVertical: 12,
                        alignItems: 'center',
                      }}
                      onPress={() => setShowSitePicker(false)}
                    >
                      <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 15 }}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          )}

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
                onPress={() => {
                  const newRememberMe = !rememberMe;
                  setRememberMe(newRememberMe);
                  // Si décochée, supprimer immédiatement les données sauvegardées
                  if (!newRememberMe) {
                    SecureStore.deleteItemAsync('krc_remember_credentials').catch(console.log);
                  }
                }}
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