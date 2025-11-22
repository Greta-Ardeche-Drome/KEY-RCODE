import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarPosition: "bottom",
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 65 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          // Ajoute cette ligne pour masquer la barre lors du scroll
          display: "flex",
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        // Ajoute cette option pour masquer la barre lors du scroll
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* Tes onglets existants */}
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
              backgroundColor: focused ? '#3B82F6' : 'transparent',
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
    </Tabs>
  );
}
