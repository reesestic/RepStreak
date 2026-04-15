import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { Exercise } from "@/lib/models/Exercise";
import { getExercisesByMuscles } from "@/lib/services/exerciseService";
import { generateWorkout } from "@/lib/services/generateWorkout";

export default function Home() {
    const router = useRouter();

    async function handleStartWorkout() {
        const muscles = ["back", "biceps"];
        const time = 45;

        const rawExercises = await getExercisesByMuscles(muscles);
        const exercises = rawExercises.map(e => new Exercise(e));

        const workout: Exercise[] = generateWorkout({ exercises, muscles, timeMinutes: time });

        router.push({
            pathname: "/generate",
            params: {
                // 🔥 Exercise has toPlain(), use it
                workout: JSON.stringify(workout.map(e => e.toPlain())),
                allExercises: JSON.stringify(exercises.map(e => e.toPlain())),
            },
        });
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