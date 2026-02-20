// components/AdminUnlockPanel.tsx
// Interface d'administration pour déverrouiller les utilisateurs

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useEmergencyService } from '../hooks/useEmergencyService';
import { useDarkMode } from '../DarkModeContext';

interface AdminUnlockPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function AdminUnlockPanel({ visible, onClose }: AdminUnlockPanelProps) {
  const [targetUsername, setTargetUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetUserLock, isAdmin } = useEmergencyService();
  const { darkMode } = useDarkMode();
  const styles = darkMode ? darkStyles : lightStyles;

  const handleUnlock = async () => {
    if (!targetUsername.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom d\'utilisateur.');
      return;
    }

    Alert.alert(
      'Confirmer le déverrouillage',
      `Êtes-vous sûr de vouloir déverrouiller le compte "${targetUsername.trim()}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déverrouiller',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const success = await resetUserLock(targetUsername.trim());
              if (success) {
                setTargetUsername('');
                // On peut fermer le modal après 1.5s pour laisser le temps de voir le message
                setTimeout(() => {
                  onClose();
                }, 1500);
              }
            } catch (error) {
              console.error('Erreur unlock:', error);
              Alert.alert('Erreur', 'Une erreur est survenue.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!isAdmin) {
    return null; // Ne rien afficher si pas admin
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>🔓 Déverrouillage Administrateur</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Entrez le nom d'utilisateur du compte à déverrouiller.
            Cette action réinitialise le verrouillage d'urgence pour l'utilisateur spécifié.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nom d'utilisateur :</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ex: jean.dupont"
              placeholderTextColor={darkMode ? '#9CA3AF' : '#6B7280'}
              value={targetUsername}
              onChangeText={setTargetUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.unlockButton]}
              onPress={handleUnlock}
              disabled={isLoading || !targetUsername.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.unlockButtonText}>Déverrouiller</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- STYLES CLAIRS ---
const lightStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  unlockButton: {
    backgroundColor: '#10B981',
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// --- STYLES SOMBRES ---
const darkStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#374151',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F3F4F6',
    backgroundColor: '#1F2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#4B5563',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  unlockButton: {
    backgroundColor: '#059669',
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});