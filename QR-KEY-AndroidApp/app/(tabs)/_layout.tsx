import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
        tabBarPosition: "top",
        tabBarStyle: { backgroundColor: '#b9b9b9ff',},
        headerShown: false,
        tabBarLabelStyle: { fontSize: 13, fontWeight: "bold", marginTop: -5 },
        
        tabBarItemStyle: { padding: -5 },
}}>
      <Tabs.Screen name="home"    options={{tabBarIcon: () => null, title: "Accueil" }} />
      <Tabs.Screen name="QR_Code" options={{tabBarIcon: () => null, title: "QR_Code" }} />
      <Tabs.Screen name="profile" options={{tabBarIcon: () => null, title: "Profil" }} />
    </Tabs>
  );
}
