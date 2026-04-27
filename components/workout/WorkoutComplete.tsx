import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function WorkoutComplete({ log }: any) {
    const router = useRouter();

    const completed = log.filter((e: any) => e.sets.length > 0);

    function goHome() {
        router.replace("/");
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Workout Complete 🎉</Text>

            <Text style={styles.subtitle}>
                Completed: {completed.length} / {log.length}
            </Text>

            <View style={styles.card}>
                {log.map((entry: any, i: number) => {
                    const isSkipped = entry.sets.length === 0;

                    return (
                        <Text key={i} style={styles.item}>
                            • {entry.exercise.name} {isSkipped ? "(Skipped)" : ""}
                        </Text>
                    );
                })}
            </View>

            <TouchableOpacity style={styles.button} onPress={goHome}>
                <Text style={styles.buttonText}>Go Home</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#05070A",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        marginBottom: 10,
    },

    subtitle: {
        color: "#aaa",
        marginBottom: 20,
    },

    card: {
        width: "100%",
        backgroundColor: "#111",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#222",
    },

    item: {
        color: "white",
        marginBottom: 6,
    },

    button: {
        marginTop: 20,
        backgroundColor: "#2563eb",
        padding: 14,
        borderRadius: 10,
    },

    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
});