import { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutService } from "@/lib/services/WorkoutService";
import { supabase } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_USAGE = 3;
const OPTIONS_PER_SLOT = 4;

function shuffle(arr: any[]) {
    return [...arr].sort(() => Math.random() - 0.5);
}

export default function Generate() {
    const router = useRouter();

    const { workout, allExercises, soreMuscles } = useLocalSearchParams();

    const parsedSore: string[] = (() => {
        try {
            return soreMuscles ? JSON.parse(soreMuscles as string) : [];
        } catch {
            return [];
        }
    })();

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

    function removeSlot(i: number) {
        const newSlots = [...slots];
        newSlots.splice(i, 1);

        const newIndices = [...indices];
        newIndices.splice(i, 1);

        setSlots(newSlots);
        setIndices(newIndices);
    }

    const [slots, setSlots] = useState<any[][]>(() => {
        if (!parsedWorkout.length || !parsedAll.length) return [];

        const usageCount: Record<string, number> = {};

        return parsedWorkout.map((primary: any) => {
            usageCount[primary.id] = (usageCount[primary.id] || 0) + 1;

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
                if (count >= MAX_USAGE) continue;
                if (slot.some((e) => e.id === candidate.id)) continue;
                slot.push(candidate);
                usageCount[candidate.id] = count + 1;
            }

            return slot;
        });
    });

    const [indices, setIndices] = useState<number[]>(() => slots.map(() => 0));

    if (!parsedWorkout.length || !parsedAll.length) {
        return (
            <View style={styles.center}>
                <Text>No exercises generated.</Text>
            </View>
        );
    }

    function next(i: number) {
        const updated = [...indices];
        updated[i] = (updated[i] + 1) % slots[i].length;
        setIndices(updated);
    }

    function prev(i: number) {
        const updated = [...indices];
        updated[i] = (updated[i] - 1 + slots[i].length) % slots[i].length;
        setIndices(updated);
    }

    const selected = slots.map((slot, i) => slot[indices[i]]);

    return (
        <>
            <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Your Workout</Text>

                    <View style={{ width: 24 }} /> {/* spacer for centering */}
                </View>

                <ScrollView style={styles.container}>

                    {slots.map((options: any[], i: number) => {
                        const current = options[indices[i]];
                        const isSore = parsedSore.includes(current?.primary_muscle);

                        return (
                            <View key={i} style={styles.card}>

                                {/* LEFT SIDE: TEXT */}
                                <View style={styles.textContainer}>
                                    <Text style={styles.exerciseText}>
                                        Exercise {i + 1}: {current?.name}
                                        {isSore && <Text> 🔥</Text>}
                                    </Text>

                                    <Text style={styles.subText}>
                                        ({current?.primary_muscle})
                                        {isSore && <Text> • Sore (-50%)</Text>}
                                    </Text>
                                </View>

                                {/* RIGHT SIDE: ACTIONS */}
                                <View style={styles.actions}>
                                    <TouchableOpacity onPress={() => prev(i)}>
                                        <Ionicons name="chevron-back" size={22} color="#f97316" />
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => next(i)}>
                                        <Ionicons name="chevron-forward" size={22} color="#f97316" />
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => removeSlot(i)} style={{ marginLeft: 12 }}>
                                        <Ionicons name="trash-outline" size={22} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>

                            </View>
                        );
                    })}

                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            const enrichedWorkout = await WorkoutService.generateWithWeights(
                                user!.id,
                                selected,
                                parsedSore
                            );

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
            </SafeAreaView>


                <Modal visible={!!modalExercise} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{modalExercise?.name}</Text>
                        <Text style={styles.sub}>{modalExercise?.primary_muscle}</Text>
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
        padding: 20,
        paddingTop: 10,
    },

    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
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
        color: "white",
    },

    subText: {
        fontSize: 13,
        color: "#9CA3AF",
        marginTop: 4,
    },

    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#0f172a", // dark card
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 12, // spacing between cards
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

    textContainer: {
        flex: 1,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
});