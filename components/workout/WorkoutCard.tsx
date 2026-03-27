import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

export default function WorkoutCard({
                                        exercise,
                                        exerciseNumber,
                                        totalExercises,
                                        nextExerciseName,
                                        onFinish,
                                        onSkip,
                                    }: any) {
    const [sets, setSets] = useState<any[]>([]);
    const [targetSets, setTargetSets] = useState(exercise.targetSets);
    const [reps, setReps] = useState(exercise.targetReps);
    const [weight, setWeight] = useState("");
    const [timer, setTimer] = useState(0);
    const [running, setRunning] = useState(false);

    const translateX = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    // TIMER
    useEffect(() => {
        let interval: any;
        if (running) {
            interval = setInterval(() => {
                setTimer((t) => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [running]);

    function formatTime(sec: number) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    function startSet() {
        setTimer(0);
        setRunning(true);
    }

    function finishSet() {
        setRunning(false);

        setSets([
            ...sets,
            {
                reps,
                weight: Number(weight) || 0,
                time: timer,
            },
        ]);
    }

    function addSet() {
        setSets([...sets, { reps, weight }]);
    }

    function finishExercise() {
        translateX.value = withTiming(400, { duration: 300 });
        setTimeout(() => onFinish(sets), 300);
    }

    const canDecrease = targetSets > sets.length;

    return (
        <Animated.View style={[styles.card, animatedStyle]}>
            {/* TOP BAR */}
            <View style={styles.topBar}>
                <View>
                    {nextExerciseName && (
                        <Text style={styles.next}>Next: {nextExerciseName}</Text>
                    )}
                    <Text style={styles.remaining}>
                        {totalExercises - exerciseNumber} left
                    </Text>
                </View>

                <TouchableOpacity onPress={onSkip}>
                    <Text style={styles.skip}>Skip</Text>
                </TouchableOpacity>
            </View>

            {/* TITLE */}
            <Text style={styles.title}>{exercise.name}</Text>

            {/* IMAGE */}
            <Image source={{ uri: exercise.image }} style={styles.image} />

            {/* SETS */}
            <View style={styles.section}>
                <View style={styles.setHeader}>
                    <Text style={styles.sectionTitle}>Sets</Text>

                    <View style={styles.adjust}>
                        <TouchableOpacity
                            disabled={!canDecrease}
                            onPress={() => setTargetSets(targetSets - 1)}
                        >
                            <Ionicons name="remove" size={20} />
                        </TouchableOpacity>

                        <Text>{targetSets}</Text>

                        <TouchableOpacity onPress={() => setTargetSets(targetSets + 1)}>
                            <Ionicons name="add" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {sets.length === 0 ? (
                    <Text style={styles.empty}>No sets yet</Text>
                ) : (
                    sets.map((s, i) => (
                        <Text key={i} style={styles.setRow}>
                            Set {i + 1}: {s.reps} @ {s.weight}
                            {s.time ? ` (${formatTime(s.time)})` : ""}
                        </Text>
                    ))
                )}
            </View>

            {/* INPUT */}
            <View style={styles.row}>
                <TextInput
                    style={styles.input}
                    value={String(reps)}
                    onChangeText={(v) => setReps(Number(v))}
                    placeholder="Reps"
                />
                <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="Weight"
                />
            </View>

            {/* TIMER */}
            <View style={styles.timer}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="timer-outline" size={20} />
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                </View>

                {!running ? (
                    <TouchableOpacity onPress={startSet}>
                        <Text style={styles.button}>Do Set</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={finishSet}>
                        <Text style={styles.button}>Finish Set</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ACTIONS */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.primary} onPress={addSet}>
                    <Text style={styles.primaryText}>Add Set</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondary} onPress={finishExercise}>
                    <Text>Finish →</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "white",
        margin: 20,
        padding: 20,
        borderRadius: 20,
        elevation: 5,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    next: { color: "#666" },
    remaining: { fontWeight: "bold" },
    skip: { color: "red" },
    title: { fontSize: 24, fontWeight: "bold", marginVertical: 10 },
    image: { width: "100%", height: 150, borderRadius: 10 },
    section: { marginVertical: 10 },
    sectionTitle: { fontWeight: "bold" },
    setHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    adjust: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    empty: { color: "#aaa" },
    setRow: { marginTop: 5 },
    row: { flexDirection: "row", gap: 10 },
    input: {
        borderWidth: 1,
        flex: 1,
        padding: 10,
        borderRadius: 10,
    },
    timer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 10,
    },
    timerText: { marginLeft: 5 },
    button: { color: "blue" },
    actions: { flexDirection: "row", gap: 10 },
    primary: {
        flex: 1,
        backgroundColor: "#2563eb",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    primaryText: { color: "white" },
    secondary: {
        flex: 1,
        borderWidth: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
});