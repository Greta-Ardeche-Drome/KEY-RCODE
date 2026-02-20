import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDarkMode } from "../DarkModeContext"; // Import du hook dark mode
import { useSession } from "../UserContext"; // Import pour vérifier le rôle admin

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { darkMode } = useDarkMode();
  const { user } = useSession();
  
  // Déterminer si l'utilisateur est admin
  const isAdmin = user?.role === 'admin';

  const tabBarStyle = {
    backgroundColor: darkMode ? '#23232b' : '#FFFFFF',
    height: 65 + insets.bottom,
    paddingBottom: 8 + insets.bottom,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: darkMode ? '#27272A' : '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // display: "flex", // "flex" is default for View, so this can be omitted
  };

  return (
    <Tabs
      screenOptions={{
        tabBarPosition: "bottom",
        tabBarStyle,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarActiveTintColor: darkMode ? '#60A5FA' : '#3B82F6',
        tabBarInactiveTintColor: darkMode ? '#A1A1AA' : '#9CA3AF',
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 28 : 26 }}>
              {focused ? '🏠' : '🏘️'}
            </Text>
          ),
          title: "Accueil"
        }}
      />
      <Tabs.Screen
        name="qrcode"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: focused ? (darkMode ? '#60A5FA' : '#3B82F6') : 'transparent',
              borderRadius: 12,
              width: 50,
              height: 50,
              marginTop: focused ? -20 : 0,
            }}>
              <Text style={{ fontSize: focused ? 32 : 28 }}>
                📱
              </Text>
            </View>
          ),
          title: "QR Code"
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 28 : 26 }}>
              {focused ? '👤' : '👥'}
            </Text>
          ),
          title: "Profil"
        }}
      />
      {/* Onglet Admin - Visible uniquement pour les administrateurs */}
      <Tabs.Screen
        name="admin"
        options={{
          href: isAdmin ? '/(tabs)/admin' : null, // Masquer complètement l'onglet pour les non-admins
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 28 : 26 }}>
              {focused ? '⚡' : '🔧'}
            </Text>
          ),
          title: "Admin"
        }}
      />
    </Tabs>
  );
}
