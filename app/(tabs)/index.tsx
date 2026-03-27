import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
    const router = useRouter();

    function handleStartWorkout() {
        router.push("/workout"); // go to workout flow
    }

    return (
        <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>

            {/* 👋 Greeting */}
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                Welcome back, Reese 👋
            </Text>

            {/* 🔥 Streak */}
            <Text style={{ marginTop: 10, fontSize: 16 }}>
                🔥 Let’s continue your 5-day streak!
            </Text>

            {/* 🏋️ Today's workout */}
            <Text style={{ marginTop: 20, fontSize: 18 }}>
                Today’s Workout:
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "600" }}>
                Chest & Back
            </Text>

            {/* ▶️ Start button */}
            <View style={{ marginTop: 30 }}>
                <Button title="Start Workout" onPress={handleStartWorkout} />
            </View>

        </View>
    );
}