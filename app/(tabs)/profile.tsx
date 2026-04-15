import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SPLITS, SplitType } from "@/lib/splits";

export default function Profile() {
    const { user, signOut } = useAuth();

    const [split, setSplit] = useState<SplitType | null>(null);
    const [splitIndex, setSplitIndex] = useState(0);

    const [gym, setGym] = useState("Home Gym");
    const [squad, setSquad] = useState("The Dawgs");

    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    const [age, setAge] = useState("");
    const [sex, setSex] = useState("Male");

    const [showSplitModal, setShowSplitModal] = useState(false);
    const [showDayModal, setShowDayModal] = useState(false);
    const [showPersonalModal, setShowPersonalModal] = useState(false);

    // 🔥 LOAD PROFILE
    useEffect(() => {
        async function load() {
            const { data } = await supabase
                .from("Profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (data) {
                setSplit((data.workout_split as SplitType) || null);
                setSplitIndex(data.split_index || 0);

                setWeight(String(data.weight || ""));
                setHeight(String(data.height || ""));
                setAge(String(data.age || ""));
                setSex(data.sex || "Male");
            }
        }

        load();
    }, []);

    // 🔥 SAVE SPLIT
    async function saveSplit(newSplit: SplitType, newIndex: number) {
        await supabase.from("Profiles").upsert({
            id: user.id,
            workout_split: newSplit,
            split_index: newIndex,
        });

        setSplit(newSplit);
        setSplitIndex(newIndex);
    }

    // 🔥 SAVE PERSONAL DATA
    async function savePersonal() {
        await supabase.from("Profiles").upsert({
            id: user.id,
            weight: Number(weight),
            height: Number(height),
            age: Number(age),
            sex: sex,
        });

        setShowPersonalModal(false);
    }

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <Image
                    source={{ uri: "https://i.pravatar.cc/150" }}
                    style={styles.avatar}
                />
                <Text style={styles.username}>Reese</Text>
            </View>

            {/* SPLIT */}
            <View style={styles.card}>
                <TouchableOpacity onPress={() => setShowSplitModal(true)}>
                    <Text style={styles.label}>Workout Split</Text>
                    <Text style={[styles.value, !split && { color: "#2563eb" }]}>
                        {split ? split : "Add a split"}
                    </Text>
                </TouchableOpacity>

                {split && (
                    <Text style={styles.sub}>
                        Current Day: {splitIndex + 1}
                    </Text>
                )}
            </View>

            {/* GYM + SQUAD */}
            <View style={styles.card}>
                <Row label="Gym" value={gym} />
                <Row label="Squad" value={squad} />
            </View>

            {/* PERSONAL DATA */}
            <View style={styles.card}>
                <Row label="Weight" value={weight || "Not set"} />
                <Row label="Height" value={height || "Not set"} />
                <Row label="Age" value={age || "Not set"} />
                <Row label="Sex" value={sex} />

                <TouchableOpacity onPress={() => setShowPersonalModal(true)}>
                    <Text style={styles.edit}>Edit Personal Data</Text>
                </TouchableOpacity>
            </View>

            {/* SIGN OUT */}
            <TouchableOpacity onPress={signOut} style={styles.signOut}>
                <Text style={{ color: "red" }}>Sign Out</Text>
            </TouchableOpacity>

            {/* SPLIT SELECT */}
            <Modal visible={showSplitModal} transparent>
                <View style={styles.modal}>
                    {(Object.keys(SPLITS) as SplitType[]).map((s) => (
                        <TouchableOpacity
                            key={s}
                            onPress={() => {
                                setShowSplitModal(false);
                                setSplit(s);
                                setShowDayModal(true);
                            }}
                        >
                            <Text style={styles.option}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            {/* DAY SELECT */}
            <Modal visible={showDayModal} transparent>
                <View style={styles.modal}>
                    <Text>Select Starting Day</Text>

                    {split && SPLITS[split].map((_, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => {
                                saveSplit(split, i);
                                setShowDayModal(false);
                            }}
                        >
                            <Text style={styles.option}>
                                Day {i + 1}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            {/* PERSONAL DATA MODAL */}
            <Modal visible={showPersonalModal} transparent>
                <View style={styles.modal}>
                    <View style={styles.modalCard}>
                        <Text>Weight</Text>
                        <TextInput style={styles.input} value={weight} onChangeText={setWeight} />

                        <Text>Height</Text>
                        <TextInput style={styles.input} value={height} onChangeText={setHeight} />

                        <Text>Age</Text>
                        <TextInput style={styles.input} value={age} onChangeText={setAge} />

                        <Text>Sex</Text>
                        <TextInput style={styles.input} value={sex} onChangeText={setSex} />

                        <TouchableOpacity onPress={savePersonal}>
                            <Text style={styles.save}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

function Row({ label, value }: any) {
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f7f7f7" },
    header: { alignItems: "center", marginBottom: 30 },
    avatar: { width: 90, height: 90, borderRadius: 45 },
    username: { fontSize: 22, fontWeight: "bold" },

    card: {
        backgroundColor: "white",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8
    },

    label: { color: "#888" },
    value: { fontWeight: "bold" },

    sub: { marginTop: 5, color: "#666" },

    edit: {
        marginTop: 10,
        color: "#2563eb",
        fontWeight: "600"
    },

    signOut: { marginTop: 20, alignItems: "center" },

    modal: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },

    modalCard: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        width: 250
    },

    option: {
        backgroundColor: "white",
        padding: 12,
        margin: 5,
        borderRadius: 8,
    },

    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 8,
        marginBottom: 10,
        borderRadius: 6
    },

    save: {
        color: "#2563eb",
        fontWeight: "bold",
        textAlign: "center"
    }
});