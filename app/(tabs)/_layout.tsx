import { Tabs } from "expo-router";
// import { useAuth } from "../AuthContext";

export default function TabsLayout() {
    // const { user, loading } = useAuth();
    //
    // if (loading) return null;
    //
    // if (!user) return <Redirect href="/login" />;

    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="history" options={{ title: "History" }} />
            <Tabs.Screen name="social" options={{ title: "Social" }} />
            <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        </Tabs>
    );
}