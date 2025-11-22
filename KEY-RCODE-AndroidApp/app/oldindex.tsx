import { useRouter } from "expo-router";
import { Text, View } from "react-native";
export default function Index() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 22 }}>Bienvenue sur QR-KEY 🗝️</Text>
    </View>
  );
}
const styles = {
  container: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
};
