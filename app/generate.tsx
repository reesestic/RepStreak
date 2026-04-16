import { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    Image,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutService } from "@/lib/services/WorkoutService";
import { supabase } from "@/lib/supabase";

const PLACEHOLDER = {
    uri: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800",
};

const MAX_USAGE = 3;
const OPTIONS_PER_SLOT = 4;

// 🔥 SAFE SHUFFLE (runs ONCE only)
function shuffle(arr: any[]) {
    return [...arr].sort(() => Math.random() - 0.5);
}

export default function Generate() {
    const router = useRouter();
    const { workout, allExercises } = useLocalSearchParams();

    // ✅ SAFE PARSE
    let parsedWorkout: any[] = [];
    let parsedAll: any[] = [];

    try {
        parsedWorkout = workout ? JSON.parse(workout as string) : [];
        parsedAll = allExercises ? JSON.parse(allExercises as string) : [];
    } catch {
        parsedWorkout = [];
        parsedAll = [];
    }

    const [modalExercise, setModalExercise] = useState<any | null>(null);

    // ❌ FAIL SAFE
    if (!parsedWorkout.length || !parsedAll.length) {
        return (
            <View style={styles.center}>
                <Text>No exercises generated.</Text>
            </View>
        );
    }

    // 🔥 LOCKED SLOT GENERATION (RUNS ONLY ONCE)
    const [slots] = useState(() => {
        const usageCount: Record<string, number> = {};

        return parsedWorkout.map((primary: any) => {
            // count primary usage
            usageCount[primary.id] = (usageCount[primary.id] || 0) + 1;

            // same muscle pool
            const pool = shuffle(
                parsedAll.filter(
                    (e: any) =>
                        e.primary_muscle === primary.primary_muscle &&
                        e.id !== primary.id
                )
            );

            const slot = [primary];

            for (const candidate of pool) {
                if (slot.length >= OPTIONS_PER_SLOT) break;

                const count = usageCount[candidate.id] || 0;

                // 🚫 global cap
                if (count >= MAX_USAGE) continue;

                // 🚫 no duplicates in row
                if (slot.some((e) => e.id === candidate.id)) continue;

                slot.push(candidate);
                usageCount[candidate.id] = count + 1;
            }

            return slot;
        });
    });

    // 🔥 carousel index per row
    const [indices, setIndices] = useState(slots.map(() => 0));

    function next(i: number) {
        const updated = [...indices];
        updated[i] = (updated[i] + 1) % slots[i].length;
        setIndices(updated);
    }

    function prev(i: number) {
        const updated = [...indices];
        updated[i] =
            (updated[i] - 1 + slots[i].length) % slots[i].length;
        setIndices(updated);
    }

    const selected = slots.map((slot, i) => slot[indices[i]]);

    return (
        <>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Your Workout</Text>

                {slots.map((options: any[], i: number) => {
                    const current = options[indices[i]];

                    return (
                        <View key={i} style={styles.row}>
                            {/* LEFT */}
                            <TouchableOpacity onPress={() => prev(i)}>
                                <Ionicons name="chevron-back" size={22} color="#444" />
                            </TouchableOpacity>

                            {/* CENTER */}
                            <View style={styles.centerContent}>
                                <Text style={styles.exerciseText}>
                                    Exercise {i + 1}: {current?.name}
                                </Text>

                                <Text style={styles.subText}>
                                    ({current?.primary_muscle})
                                </Text>
                            </View>

                            {/* RIGHT */}
                            <TouchableOpacity onPress={() => next(i)}>
                                <Ionicons name="chevron-forward" size={22} color="#444" />
                            </TouchableOpacity>

                            {/* INFO */}
                            <TouchableOpacity
                                onPress={() => setModalExercise(current)}
                                style={styles.infoBtn}
                            >
                                <Text style={styles.infoText}>?</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {/* START */}
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={async () => {
                        const { data: { user } } = await supabase.auth.getUser();
                        const enrichedWorkout = await WorkoutService.generateWithWeights(user!.id, selected);

                        router.push({
                            pathname: "/workout",
                            params: {
                                workout: JSON.stringify(enrichedWorkout.map(we => we.toRoutePlain())),
                            },
                        });
                    }}
                >
                    <Text style={styles.startText}>Start Workout</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* MODAL */}
            <Modal visible={!!modalExercise} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.card}>
                        <Image source={PLACEHOLDER} style={styles.image} />

                        <Text style={styles.cardTitle}>
                            {modalExercise?.name}
                        </Text>

                        <Text style={styles.sub}>
                            {modalExercise?.primary_muscle}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setModalExercise(null)}
                        style={styles.closeBtn}
                    >
                        <Text style={{ color: "white" }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        padding: 20,
    },

    title: {
        fontSize: 26,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 25,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },

    centerContent: {
        alignItems: "center",
        marginHorizontal: 12,
        minWidth: 240,
    },

    exerciseText: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },

    subText: {
        fontSize: 13,
        color: "#777",
        marginTop: 2,
    },

    infoBtn: {
        marginLeft: 10,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "#eee",
        justifyContent: "center",
        alignItems: "center",
    },

    infoText: {
        fontWeight: "bold",
    },

    startButton: {
        marginTop: 30,
        backgroundColor: "#2563eb",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
    },

    startText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },

    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111",
    },

    card: {
        width: "50%",
        height: 500,
        backgroundColor: "black",
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 3,
        borderColor: "#f97316",
        alignItems: "center",
    },

    image: {
        width: "100%",
        height: 350,
    },

    cardTitle: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        padding: 12,
        textAlign: "center",
    },

    sub: {
        color: "#aaa",
        textAlign: "center",
        marginBottom: 10,
    },

    closeBtn: {
        marginTop: 20,
        backgroundColor: "#f97316",
        padding: 12,
        borderRadius: 10,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});