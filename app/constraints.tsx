import { useState, useEffect } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    TextInput, StyleSheet, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { ProfileService } from "@/lib/services/profileService";
import { ExerciseService } from "@/lib/services/ExerciseService";
import { GenerateService } from "@/lib/services/GenerateService";
import { SPLITS, SplitType } from "@/lib/utils/splits";
import { expandMuscles } from "@/lib/utils/muscles";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
    bg: "#05070A", card: "#0B1220", accent: "#f97316",
    textPrimary: "#FFFFFF", textSecondary: "#94A3B8", border: "#1E293B",
};

export default function Constraints() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [muscles, setMuscles] = useState<string[]>([]);
    const [injured, setInjured] = useState<string[]>([]);
    const [sore, setSore] = useState<string[]>([]);
    const [time, setTime] = useState("45");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            const profile = await ProfileService.getProfile(user!.id);

            if (!profile?.workoutSplit) {
                setError("No workout split set. Please set one in your profile.");
                setLoading(false);
                return;
            }

            const splitDays = SPLITS[profile.workoutSplit as SplitType];
            const index = (profile.splitIndex ?? 0) % splitDays.length;
            const todayMuscles = Array.from(
                new Set(expandMuscles([...splitDays[index]]))
            );
            setMuscles(todayMuscles);
            setLoading(false);
        }
        load();
    }, []);

    function toggle(list: string[], setList: (v: string[]) => void, muscle: string) {
        setList(list.includes(muscle)
            ? list.filter(m => m !== muscle)
            : [...list, muscle]);
    }

    async function handleGenerate() {
        const timeNum = parseInt(time);
        if (!timeNum || timeNum < 6) {
            setError("Please enter at least 6 minutes.");
            return;
        }

        const activeMuscles = expandMuscles(
            muscles.filter(m => !injured.includes(m))
        );
        if (!activeMuscles.length) {
            setError("All muscles are injured — nothing to generate!");
            return;
        }

        const allExercises = await ExerciseService.getByMuscles(activeMuscles);
        const workout = GenerateService.generateWorkout({
            exercises: allExercises,
            muscles: activeMuscles,
            timeMinutes: timeNum,
        });

        router.push({
            pathname: "/generate",
            params: {
                workout: JSON.stringify(workout.map(e => e.toPlain())),
                allExercises: JSON.stringify(allExercises.map(e => e.toPlain())),
                soreMuscles: JSON.stringify(sore),
            },
        });
    }

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: colors.accent, fontSize: 16 }}>← Back</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ padding: 24, paddingTop: 10 }}
                showsVerticalScrollIndicator={false}
            >
            <Text style={styles.title}>Today&#39;s Workout</Text>
            <Text style={styles.subtitle}>
                Today: {muscles.map(m => m[0].toUpperCase() + m.slice(1)).join(" · ")}
            </Text>

            {error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.sectionLabel}>Any injuries?</Text>
            <Text style={styles.hint}>Injured muscles will be skipped entirely.</Text>
            <View style={styles.chipRow}>
                {muscles.map(m => (
                    <TouchableOpacity
                        key={m}
                        style={[styles.chip, injured.includes(m) && styles.chipDanger]}
                        onPress={() => toggle(injured, setInjured, m)}
                    >
                        <Text style={[styles.chipText, injured.includes(m) && styles.chipTextActive]}>
                            {m}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionLabel}>Any soreness?</Text>
            <Text style={styles.hint}>Sore muscles get 50% weight reduction.</Text>
            <View style={styles.chipRow}>
                {muscles.filter(m => !injured.includes(m)).map(m => (
                    <TouchableOpacity
                        key={m}
                        style={[styles.chip, sore.includes(m) && styles.chipWarn]}
                        onPress={() => toggle(sore, setSore, m)}
                    >
                        <Text style={[styles.chipText, sore.includes(m) && styles.chipTextActive]}>
                            {m}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionLabel}>Workout time (minutes)</Text>
            <Text style={styles.hint}>~6 min per exercise (3 sets + rest).</Text>
            <TextInput
                style={styles.input}
                value={time}
                onChangeText={setTime}
                keyboardType="number-pad"
                placeholderTextColor={colors.textSecondary}
                placeholder="45"
            />

            <TouchableOpacity style={styles.button} onPress={handleGenerate}>
                <Text style={styles.buttonText}>Generate Workout →</Text>
            </TouchableOpacity>
        </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
    title: {
        fontSize: 32,
        fontWeight: "900",
        color: colors.textPrimary,
        marginTop: 4,
        marginBottom: 6,
    },
    header: {
        marginBottom: 10,
    },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 28 },
    sectionLabel: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: 24, marginBottom: 4 },
    hint: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: colors.border,
        backgroundColor: colors.card,
    },
    chipDanger: { backgroundColor: "#7f1d1d", borderColor: "#ef4444" },
    chipWarn: { backgroundColor: "#78350f", borderColor: "#f59e0b" },
    chipText: { color: colors.textSecondary, fontWeight: "600", textTransform: "capitalize" },
    chipTextActive: { color: colors.textPrimary },
    input: {
        backgroundColor: colors.card, color: colors.textPrimary,
        borderRadius: 12, padding: 14, fontSize: 20,
        borderWidth: 1, borderColor: colors.border, marginTop: 4,
    },
    button: {
        backgroundColor: colors.accent, padding: 18,
        borderRadius: 14, alignItems: "center", marginTop: 36, marginBottom: 40,
    },
    buttonText: { color: "white", fontWeight: "800", fontSize: 16 },
    error: { color: "#ef4444", marginBottom: 12, fontWeight: "600" },
});