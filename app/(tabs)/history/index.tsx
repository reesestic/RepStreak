import { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { HistoryService, ExerciseSummary } from "@/lib/services/HistoryService";
import { ExerciseCard } from "@/components/history/ExerciseCard";

// Pair items into [left, right] rows for a 2-column grid.
// Done manually instead of FlatList numColumns to avoid re-render issues
// with variable card heights.
function pairItems<T>(arr: T[]): (T | null)[][] {
    const rows: (T | null)[][] = [];
    for (let i = 0; i < arr.length; i += 2) {
        rows.push([arr[i], arr[i + 1] ?? null]);
    }
    return rows;
}

export default function History() {
    const { user } = useAuth();
    const router = useRouter();
    const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) return;
        setLoading(true);
        HistoryService.getExerciseHistory(user.id)
            .then(setExercises)
            .catch((e) => setError(e.message ?? "Failed to load history"))
            .finally(() => setLoading(false));
    }, [user?.id]);

    function handleCardPress(item: ExerciseSummary) {
        // Pass summary fields as params so [id].tsx doesn't need to re-fetch them
        router.push({
            pathname: "/(tabs)/history/[id]" as any,
            params: {
                id: item.exercise.id,
                name: item.exercise.name,
                primary_muscle: item.exercise.primary_muscle,
                times_completed: String(item.times_completed),
                pr_weight: String(item.pr_weight),
            },
        });
    }

    const rows = pairItems(exercises);

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <Text style={styles.title}>History</Text>
                <Text style={styles.subtitle}>
                    {exercises.length > 0
                        ? `Your top ${exercises.length} exercises`
                        : "Track your progress"}
                </Text>
            </View>

            {loading && (
                <ActivityIndicator style={styles.centered} color="#3B82F6" size="large" />
            )}

            {!loading && error && (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {!loading && !error && exercises.length === 0 && (
                <View style={styles.centered}>
                    <Text style={styles.emptyIcon}>🏋️</Text>
                    <Text style={styles.emptyText}>No workouts yet</Text>
                    <Text style={styles.emptySubtext}>
                        Complete a session to start tracking your history.
                    </Text>
                </View>
            )}

            {!loading && !error && exercises.length > 0 && (
                <FlatList
                    data={rows}
                    keyExtractor={(_, i) => String(i)}
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: [left, right] }) => (
                        <View style={styles.row}>
                            <ExerciseCard item={left!} onPress={() => handleCardPress(left!)} />
                            {right ? (
                                <ExerciseCard item={right} onPress={() => handleCardPress(right)} />
                            ) : (
                                <View style={styles.cardSpacer} />
                            )}
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const GAP = 12;
const H_PAD = 16;

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F9FAFB" },
    header: {
        paddingHorizontal: H_PAD,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 30,
        fontWeight: "800",
        color: "#111827",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: "#9CA3AF",
        marginTop: 2,
    },
    grid: {
        paddingHorizontal: H_PAD,
        paddingTop: 12,
        paddingBottom: 32,
        gap: GAP,
    },
    row: {
        flexDirection: "row",
        gap: GAP,
    },
    cardSpacer: { flex: 1 },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 80,
    },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: "700", color: "#374151" },
    emptySubtext: {
        fontSize: 14,
        color: "#9CA3AF",
        marginTop: 6,
        textAlign: "center",
        paddingHorizontal: 40,
    },
    errorText: {
        fontSize: 15,
        color: "#EF4444",
        textAlign: "center",
        paddingHorizontal: 32,
    },
});