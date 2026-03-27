import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Keyboard,
    TouchableWithoutFeedback,
    AppState,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const colors = {
    bg: "#05070A",
    card: "#0B1220",
    accent: "#f97316",
    textPrimary: "#FFFFFF",
    textSecondary: "#94A3B8",
    border: "#1E293B",
};

export default function WorkoutCard({
                                        exercise,
                                        exerciseNumber,
                                        totalExercises,
                                        nextExerciseName,
                                        upcomingExercises = [],
                                        onReorder,
                                        onFinish,
                                        onSkip,
                                    }: any) {
    const [sets, setSets] = useState<any[]>([]);
    const [reps, setReps] = useState(exercise.targetReps);
    const [weight, setWeight] = useState("");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [tick, setTick] = useState(0);
    const [running, setRunning] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editReps, setEditReps] = useState("");
    const [editWeight, setEditWeight] = useState("");
    const [editTime, setEditTime] = useState("");
    const [showReorder, setShowReorder] = useState(false);
    const [reorderList, setReorderList] = useState<any[]>(upcomingExercises);

    const nextSetNumber = sets.length + 1;
    const translateX = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    // Sync reorderList when upcomingExercises changes
    useEffect(() => {
        setReorderList(upcomingExercises);
    }, [upcomingExercises]);

    // TIMER
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                setTick((t) => t + 1);
                interval = setInterval(() => setTick((t) => t + 1), 1000);
            } else {
                if (interval) clearInterval(interval);
            }
        });

        interval = setInterval(() => setTick((t) => t + 1), 1000);

        return () => {
            sub.remove();
            if (interval) clearInterval(interval);
        };
    }, []);

    function formatTime(sec: number) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    const elapsed = startTime
        ? Math.floor((Date.now() - startTime) / 1000)
        : 0;

    function handleSetPress() {
        if (!running) {
            setStartTime(Date.now());
            setRunning(true);
        } else {
            setRunning(false);
            setSets([...sets, { reps, weight: Number(weight) || 0, time: elapsed }]);
        }
    }

    function deleteSet(index: number) {
        const updated = [...sets];
        updated.splice(index, 1);
        setSets(updated);
    }

    function finishExercise() {
        translateX.value = withTiming(400, { duration: 300 });
        setTimeout(() => onFinish(sets), 300);
    }

    // Move item up in reorder list
    function moveUp(i: number) {
        if (i === 0) return;
        const updated = [...reorderList];
        [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
        setReorderList(updated);
        onReorder(updated);
    }

    // Move item down in reorder list
    function moveDown(i: number) {
        if (i === reorderList.length - 1) return;
        const updated = [...reorderList];
        [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
        setReorderList(updated);
        onReorder(updated);
    }

    return (
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowReorder(false); }}>
            <Animated.View style={[styles.card, animatedStyle]}>

                {/* TOP BAR */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        onPress={() => setShowReorder(!showReorder)}
                        style={styles.nextContainer}
                    >
                        <Text style={styles.nextLabel}>NEXT UP</Text>
                        <View style={styles.nextRow}>
                            <Text style={styles.nextName}>
                                {nextExerciseName ?? "Last Exercise"}
                            </Text>
                            <Ionicons
                                name={showReorder ? "chevron-up" : "chevron-down"}
                                size={14}
                                color={colors.textSecondary}
                            />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                        <Ionicons name="play-forward" size={14} color={colors.textSecondary} />
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* REORDER DROPDOWN */}
                {showReorder && reorderList.length > 0 && (
                    <View style={styles.reorderDropdown}>
                        <Text style={styles.reorderTitle}>REORDER UPCOMING</Text>
                        {reorderList.map((ex: any, i: number) => (
                            <View key={ex.id} style={styles.reorderRow}>
                                <Ionicons name="menu" size={16} color={colors.textSecondary} />
                                <Text style={styles.reorderName}>{i + 1}. {ex.name}</Text>
                                <View style={styles.reorderArrows}>
                                    <TouchableOpacity onPress={() => moveUp(i)} disabled={i === 0}>
                                        <Ionicons
                                            name="chevron-up"
                                            size={18}
                                            color={i === 0 ? colors.border : colors.textPrimary}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => moveDown(i)} disabled={i === reorderList.length - 1}>
                                        <Ionicons
                                            name="chevron-down"
                                            size={18}
                                            color={i === reorderList.length - 1 ? colors.border : colors.textPrimary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* TITLE */}
                <Text style={styles.title}>{exercise.name}</Text>

                {/* IMAGE */}
                <Image source={exercise.image} style={styles.image} />

                {/* SETS COMPLETED */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SETS COMPLETED</Text>

                    {sets.map((s, i) => (
                        <View key={i} style={{ marginTop: 10 }}>
                            {editingIndex === i ? (
                                <View style={styles.editCard}>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                        Editing Set {i + 1}
                                    </Text>
                                    <View style={styles.editRow}>
                                        <View style={{ flex: 1, marginRight: 10 }}>
                                            <Text style={styles.inputLabel}>REPS</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={editReps}
                                                onChangeText={setEditReps}
                                                keyboardType="numeric"
                                                returnKeyType="done"
                                                onSubmitEditing={Keyboard.dismiss}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>TIME</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={editTime}
                                                onChangeText={setEditTime}
                                                returnKeyType="done"
                                                onSubmitEditing={Keyboard.dismiss}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ marginTop: 10 }}>
                                        <Text style={styles.inputLabel}>WEIGHT (LBS)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={editWeight}
                                            onChangeText={setEditWeight}
                                            keyboardType="numeric"
                                            returnKeyType="done"
                                            onSubmitEditing={Keyboard.dismiss}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.primary, { marginTop: 10 }]}
                                        onPress={() => {
                                            const updated = [...sets];
                                            updated[i] = {
                                                reps: Number(editReps),
                                                weight: Number(editWeight),
                                                time: Number(editTime),
                                            };
                                            setSets(updated);
                                            setEditingIndex(null);
                                        }}
                                    >
                                        <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                                            Save
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.setRowContainer}>
                                    <Text style={styles.setRow}>
                                        Set {i + 1}: {s.reps} × {s.weight} lbs • {s.time}s
                                    </Text>
                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingIndex(i);
                                                setEditReps(String(s.reps));
                                                setEditWeight(String(s.weight));
                                                setEditTime(String(s.time || 0));
                                            }}
                                        >
                                            <Ionicons name="create-outline" size={18} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteSet(i)}>
                                            <Ionicons name="trash-outline" size={18} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* INPUTS */}
                <View style={{ flexDirection: "row", marginTop: 20 }}>
                    <TextInput
                        style={[styles.input, { flex: 1, marginRight: 10 }]}
                        value={String(reps)}
                        onChangeText={(v) => setReps(Number(v))}
                        placeholder="Reps"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                    />
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="Weight"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                    />
                </View>

                {/* TIMER */}
                <View style={styles.timerCard}>
                    <Text style={styles.timerLabel}>
                        {running ? "SET TIMER" : "REST TIMER"}
                    </Text>
                    {running && (
                        <Text style={styles.timerBig}>{formatTime(elapsed)}</Text>
                    )}
                    <TouchableOpacity style={styles.timerButton} onPress={handleSetPress}>
                        <Text style={styles.timerButtonText}>
                            {running ? `Finish Set ${nextSetNumber}` : `Start Set ${nextSetNumber}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ACTIONS */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.completeButton} onPress={finishExercise}>
                        <Text style={styles.completeButtonText}>Complete Exercise ✓</Text>
                    </TouchableOpacity>
                </View>

            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: colors.bg,
        padding: 20,
        borderRadius: 30,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    nextContainer: {
        flex: 1,
    },
    nextLabel: {
        color: colors.textSecondary,
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 2,
    },
    nextRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    nextName: {
        color: colors.textPrimary,
        fontWeight: "700",
        fontSize: 15,
    },
    skipButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginLeft: 10,
    },
    skipText: {
        color: colors.textSecondary,
        fontSize: 13,
    },
    reorderDropdown: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginTop: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    reorderTitle: {
        color: colors.textSecondary,
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 12,
    },
    reorderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    reorderName: {
        color: colors.textPrimary,
        fontSize: 14,
        flex: 1,
    },
    reorderArrows: {
        flexDirection: "row",
        gap: 8,
    },
    title: {
        fontSize: 42,
        fontWeight: "900",
        color: colors.textPrimary,
        letterSpacing: 1,
        marginVertical: 10,
    },
    image: {
        width: "100%",
        height: 180,
        borderRadius: 20,
        marginVertical: 10,
    },
    section: { marginVertical: 10 },
    sectionTitle: {
        color: colors.textSecondary,
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: 10,
    },
    setRow: {
        marginTop: 5,
        color: colors.textPrimary,
    },
    input: {
        backgroundColor: colors.bg,
        color: colors.textPrimary,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 16,
    },
    actions: { flexDirection: "row", gap: 10 },
    primary: {
        flex: 1,
        backgroundColor: "#2563eb",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    secondary: {
        flex: 1,
        borderWidth: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    setRowContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
    timerCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        marginVertical: 20,
    },
    timerLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: 10,
    },
    timerBig: {
        fontSize: 64,
        fontWeight: "800",
        color: colors.textPrimary,
        marginBottom: 20,
    },
    timerButton: {
        backgroundColor: "#E5E7EB",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 20,
    },
    timerButtonText: {
        fontWeight: "700",
    },
    editCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: colors.border,
    },
    editRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    inputLabel: {
        color: colors.textSecondary,
        fontSize: 11,
        marginBottom: 4,
        letterSpacing: 1,
    },
    completeButton: {
        flex: 1,
        backgroundColor: colors.accent,
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
    },
    completeButtonText: {
        color: "white",
        fontWeight: "800",
        fontSize: 16,
    },
    adjust: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    recommendation: {
        color: "#666",
        marginTop: 4,
        marginBottom: 8,
    },
});