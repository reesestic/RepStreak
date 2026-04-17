import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
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
                                        nextExerciseName,
                                        upcomingExercises = [],
                                        onReorder,
                                        onFinish,
                                        onSkip,
                                    }: any) {

    const [sets, setSets] = useState<any[]>([]);
    const [reps, setReps] = useState(String(exercise.targetReps));
    const [weight, setWeight] = useState(
        exercise.recommendedWeight
            ? String(exercise.recommendedWeight)
            : ""
    );

    const [error, setError] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [running, setRunning] = useState(false);
    const [showReorder, setShowReorder] = useState(false);
    const [reorderList, setReorderList] = useState<any[]>(upcomingExercises);


    const repsRef = useRef<TextInput>(null);
    const weightRef = useRef<TextInput>(null);

    const nextSetNumber = sets.length + 1;

    const translateX = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    function formatTime(sec: number) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    const elapsed = startTime
        ? Math.floor((Date.now() - startTime) / 1000)
        : 0;

    function validateSet(weight: number, reps: number) {
        if (weight === 0 && reps === 0) return "Invalid values";
        if (reps > 50 || weight > 600) return "Too large";
        return null;
    }

    function handleSetPress() {
        if (!running) {
            Keyboard.dismiss();
            setStartTime(Date.now());
            setRunning(true);
        } else {
            const numericWeight = Number(weight) || 0;
            const numericReps = Number(reps) || 0;

            const err = validateSet(numericWeight, numericReps);
            if (err) {
                setError(err);
                return;
            }

            setError(null);
            setRunning(false);

            setSets([
                ...sets,
                {
                    reps: numericReps,
                    weight: numericWeight,
                    time: elapsed,
                },
            ]);

            // keep weight as-is, only reset reps
            setReps(String(exercise.targetReps));
        }
    }

    function finishExercise() {
        translateX.value = withTiming(400, { duration: 300 });
        setTimeout(() => {
            translateX.value = 0;
            onFinish(sets);
        }, 300);
    }

    function moveUp(i: number) {
        if (i === 0) return;
        const updated = [...reorderList];
        [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
        setReorderList(updated);
        onReorder?.(updated);
    }

    function moveDown(i: number) {
        if (i === reorderList.length - 1) return;
        const updated = [...reorderList];
        [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
        setReorderList(updated);
        onReorder?.(updated);
    }

    useEffect(() => {
        setReorderList(upcomingExercises);
    }, [upcomingExercises]);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <Animated.View style={[styles.card, animatedStyle]}>

                    {/* TOP */}
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => setShowReorder(!showReorder)}>
                            <Text style={styles.nextName}>
                                {nextExerciseName ?? "Last Exercise"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onSkip}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    </View>

                    {showReorder && reorderList.length > 0 && (
                        <View style={{
                            backgroundColor: colors.card,
                            borderRadius: 12,
                            padding: 12,
                            marginTop: 10,
                        }}>
                            {reorderList.map((ex: any, i: number) => (
                                <View key={ex.id} style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 8,
                                }}>
                                    <Text style={{ color: colors.textPrimary }}>
                                        {i + 1}. {ex.name}
                                    </Text>

                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                        <TouchableOpacity onPress={() => moveUp(i)}>
                                            <Ionicons name="chevron-up" size={18} color="white" />
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={() => moveDown(i)}>
                                            <Ionicons name="chevron-down" size={18} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={styles.title}>{exercise.name}</Text>

                    {/* Only render image if one exists */}
                    {exercise.image && (
                        <Image source={exercise.image} style={styles.image} />
                    )}

                    {/* SETS */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>SETS COMPLETED</Text>

                        {sets.map((s, i) => (
                            <View key={i} style={styles.setRowContainer}>
                                <Text style={styles.setRow}>
                                    Set {i + 1}: {s.reps} × {s.weight} • {s.time}s
                                </Text>

                                <TouchableOpacity onPress={() => {
                                    const copy = [...sets];
                                    copy.splice(i, 1);
                                    setSets(copy);
                                }}>
                                    <Ionicons name="trash-outline" size={18} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* INPUTS */}
                    <View style={{ flexDirection: "row", marginTop: 20 }}>
                        <TextInput
                            ref={repsRef}
                            style={[styles.input, { flex: 1, marginRight: 10 }]}
                            value={reps}
                            onChangeText={setReps}
                            placeholder="Reps"
                            placeholderTextColor="#64748B"
                            keyboardType="number-pad"
                            onBlur={() => {
                                if (!reps) setReps(String(exercise.targetReps));
                            }}
                        />

                        <TextInput
                            ref={weightRef}
                            style={[styles.input, { flex: 1 }]}
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="Weight"
                            placeholderTextColor="#64748B"
                            keyboardType="number-pad"
                        />
                    </View>

                    {/* TIMER */}
                    <View style={styles.timerCard}>
                        <Text style={styles.timerLabel}>
                            {running ? "SET TIMER" : "READY"}
                        </Text>

                        {running && (
                            <Text style={styles.timerBig}>{formatTime(elapsed)}</Text>
                        )}

                        <TouchableOpacity style={styles.timerButton} onPress={handleSetPress}>
                            <Text style={styles.timerButtonText}>
                                {running
                                    ? `Finish Set ${nextSetNumber}`
                                    : `Start Set ${nextSetNumber}`}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ERROR */}
                    {error && <Text style={styles.errorText}>{error}</Text>}

                    {/* COMPLETE */}
                    <TouchableOpacity style={styles.completeButton} onPress={finishExercise}>
                        <Text style={styles.completeButtonText}>
                            Complete Exercise ✓
                        </Text>
                    </TouchableOpacity>

                </Animated.View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: colors.bg,
        padding: 20,
        borderRadius: 30,
    },
    title: {
        fontSize: 42,
        fontWeight: "900",
        color: colors.textPrimary,
        marginVertical: 10,
    },
    image: {
        width: "100%",
        height: 180,
        borderRadius: 20,
        marginVertical: 10,
    },
    section: {
        marginVertical: 10,
    },
    sectionTitle: {
        color: colors.textSecondary,
        marginBottom: 10,
    },
    setRow: {
        color: colors.textPrimary,
    },
    setRowContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    input: {
        backgroundColor: colors.bg,
        color: colors.textPrimary,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 18,
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
        padding: 14,
        borderRadius: 20,
    },
    timerButtonText: {
        fontWeight: "700",
    },
    completeButton: {
        backgroundColor: colors.accent,
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
    },
    completeButtonText: {
        color: "white",
        fontWeight: "800",
    },
    skipText: {
        color: colors.textSecondary,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    nextName: {
        color: colors.textPrimary,
        fontWeight: "700",
    },
    errorText: {
        color: "red",
        textAlign: "center",
        marginBottom: 10,
        fontWeight: "600",
    },
});