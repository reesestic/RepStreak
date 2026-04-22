import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { ExerciseSummary, muscleColor } from "@/lib/services/HistoryService";

interface Props {
    item: ExerciseSummary;
    onPress: () => void;
}

export function ExerciseCard({ item, onPress }: Props) {
    const mc = muscleColor(item.exercise.primary_muscle);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
            {/* Muscle tag */}
            <View style={[styles.muscleTag, { backgroundColor: mc.bg }]}>
                <Text style={[styles.muscleText, { color: mc.text }]}>
                    {item.exercise.primary_muscle}
                </Text>
            </View>

            {/* Name */}
            <Text style={styles.name} numberOfLines={2}>
                {item.exercise.name}
            </Text>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{item.times_completed}</Text>
                    <Text style={styles.statLabel}>Times done</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.stat}>
                    <Text style={[styles.statValue, styles.prValue]}>
                        {item.pr_weight > 0 ? `${item.pr_weight} kg` : "—"}
                    </Text>
                    <Text style={styles.statLabel}>Personal record</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        gap: 8,
    },
    muscleTag: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    muscleText: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "capitalize",
        letterSpacing: 0.3,
    },
    name: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        lineHeight: 20,
        flex: 1,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    stat: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: 17,
        fontWeight: "800",
        color: "#111827",
        letterSpacing: -0.4,
    },
    prValue: {
        color: "#3B82F6",
    },
    statLabel: {
        fontSize: 9,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 2,
        textAlign: "center",
    },
    divider: {
        width: StyleSheet.hairlineWidth,
        height: 28,
        backgroundColor: "#E5E7EB",
    },
});