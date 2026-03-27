import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
    return (
        <View style={styles.container}>

            {/* 👤 Top Section */}
            <View style={styles.header}>
                <Image
                    source={{ uri: "https://i.pravatar.cc/150" }}
                    style={styles.avatar}
                />
                <Text style={styles.username}>Reese</Text>
            </View>

            {/* ⚙️ Preferences */}
            <View style={styles.card}>
                <Row label="Workout Split" value="Push / Pull / Legs" editable />
                <Row label="Squad" value="The Dawgs" />
                <Row label="Gym" value="Home Gym" />
            </View>

            {/* 📊 Stats */}
            <View style={styles.card}>
                <Row label="🔥 Streak" value="5 days" />
                <Row label="🏋️ Workouts This Week" value="3" />
            </View>

        </View>
    );
}

function Row({ label, value, editable }: any) {
    return (
        <View style={styles.row}>
            <View>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
            </View>

            {editable && (
                <TouchableOpacity>
                    <Ionicons name="pencil" size={18} color="#666" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f7f7f7",
    },
    header: {
        alignItems: "center",
        marginBottom: 30,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 10,
    },
    username: {
        fontSize: 22,
        fontWeight: "bold",
    },
    card: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderColor: "#eee",
    },
    label: {
        fontSize: 14,
        color: "#888",
    },
    value: {
        fontSize: 16,
        fontWeight: "500",
    },
});