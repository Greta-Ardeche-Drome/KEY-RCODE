// app/theme.ts
// Constantes de thème centralisées pour éviter la duplication des couleurs
// Les composants existants utilisent encore des styles dupliqués (lightStyles/darkStyles),
// mais les nouveaux composants doivent utiliser ce fichier.

export const colors = {
  light: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    success: '#059669',
    successLight: '#DCFCE7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    warning: '#F59E0B',
    inputBg: '#F9FAFB',
    inputBorder: '#E5E7EB',
    border: '#E5E7EB',
    cardBg: '#FFFFFF',
  },
  dark: {
    background: '#1F2937',
    surface: '#27272A',
    text: '#F3F4F6',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    primary: '#60A5FA',
    primaryDark: '#3B82F6',
    success: '#34D399',
    successLight: '#166534',
    danger: '#F87171',
    dangerLight: '#7F1D1D',
    warning: '#FBBF24',
    inputBg: '#1F2937',
    inputBorder: '#4B5563',
    border: '#4B5563',
    cardBg: '#374151',
  },
} as const;

export type ThemeColors = typeof colors.light & typeof colors.dark;

/**
 * Retourne les couleurs du thème en fonction du mode sombre
 */
export function getThemeColors(darkMode: boolean) {
  return darkMode ? colors.dark : colors.light;
}
