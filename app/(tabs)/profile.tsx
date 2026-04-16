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
import { Profile } from "@/lib/models/Profile";
import { ProfileService } from "@/lib/services/profileService";
import { SPLITS, SplitType } from "@/lib/splits";

export default function ProfileScreen() {
    const { user, signOut } = useAuth();

    const [profile, setProfile] = useState<Profile | null>(null);

    const [showSplitModal, setShowSplitModal] = useState(false);
    const [showDayModal, setShowDayModal] = useState(false);
    const [showPersonalModal, setShowPersonalModal] = useState(false);

    // 🔥 LOAD PROFILE
    useEffect(() => {
        async function load() {
            const p = await ProfileService.getProfile(user.id);
            setProfile(p);
        }
        load();
    }, []);

    function requireProfile(): Profile {
        if (!profile) {
            throw new Error("Profile not loaded");
        }
        return profile;
    }

    // 🔥 CENTRALIZED UPDATE
    function updateProfile(update: Partial<Profile>) {
        const p = requireProfile();
        const updated = new Profile(p.toPlain());
        updated.updateProfile(update);
        setProfile(updated);
    }

    // 🔥 SAVE
    async function saveProfile() {
        const p = requireProfile();
        await ProfileService.updateProfile(p);
    }

    // 🔥 SAVE SPLIT
    async function saveSplit(newSplit: SplitType, newIndex: number) {
        const updated = new Profile(requireProfile().toPlain());

        updated.updateProfile({
            workoutSplit: newSplit,
            splitIndex: newIndex,
        });

        setProfile(updated);
        await ProfileService.updateProfile(updated);

        setShowDayModal(false);
    }

    // 🔥 SAVE PERSONAL DATA
    async function savePersonal() {
        await saveProfile();
        setShowPersonalModal(false);
    }

    // 🔥 EARLY RETURN (keeps JSX safe)
    if (!profile) {
        return <Text>Loading...</Text>;
    }

    const p = requireProfile(); // 🔥 single safe reference
    const split = p.workoutSplit ? SPLITS[p.workoutSplit] : null;

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <Image
                    source={{ uri: "https://i.pravatar.cc/150" }}
                    style={styles.avatar}
                />
                <Text style={styles.username}>{p.username}</Text>
            </View>

            {/* SPLIT */}
            <View style={styles.card}>
                <TouchableOpacity onPress={() => setShowSplitModal(true)}>
                    <Text style={styles.label}>Workout Split</Text>
                    <Text style={[styles.value, !p.workoutSplit && { color: "#2563eb" }]}>
                        {p.workoutSplit ? p.workoutSplit : "Add a split"}
                    </Text>
                </TouchableOpacity>

                {split && (
                    <Text style={styles.sub}>
                        Current Day: {p.getNextWorkoutDay(split.length)}
                    </Text>
                )}
            </View>

            {/* PERSONAL DATA */}
            <View style={styles.card}>
                <Row label="Weight" value={p.weight || "Not set"} />
                <Row label="Height" value={p.height || "Not set"} />
                <Row label="Age" value={p.age || "Not set"} />
                <Row label="Sex" value={p.sex || "Not set"} />

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
                                updateProfile({ workoutSplit: s });
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

                    {p.workoutSplit &&
                        SPLITS[p.workoutSplit as SplitType].map((_, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => saveSplit(p.workoutSplit as SplitType, i)}
                            >
                                <Text style={styles.option}>Day {i + 1}</Text>
                            </TouchableOpacity>
                        ))}
                </View>
            </Modal>

            {/* PERSONAL DATA MODAL */}
            <Modal visible={showPersonalModal} transparent>
                <View style={styles.modal}>
                    <View style={styles.modalCard}>

                        <Text>Weight</Text>
                        <TextInput
                            style={styles.input}
                            value={String(p.weight || "")}
                            onChangeText={(v) =>
                                updateProfile({ weight: Number(v) })
                            }
                        />

                        <Text>Height</Text>
                        <TextInput
                            style={styles.input}
                            value={String(p.height || "")}
                            onChangeText={(v) =>
                                updateProfile({ height: Number(v) })
                            }
                        />

                        <Text>Age</Text>
                        <TextInput
                            style={styles.input}
                            value={String(p.age || "")}
                            onChangeText={(v) =>
                                updateProfile({ age: Number(v) })
                            }
                        />

                        <Text>Sex</Text>
                        <TextInput
                            style={styles.input}
                            value={p.sex || ""}
                            onChangeText={(v) =>
                                updateProfile({ sex: v })
                            }
                        />

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