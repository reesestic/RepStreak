import { Stack, Redirect, usePathname } from "expo-router";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function AppNavigator() {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    if (loading) {
        return <Text>Loading...</Text>;
    }

    // 🔥 THIS IS IMPORTANT
    if (!user && pathname !== "/login") {
        return <Redirect href="/login" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}