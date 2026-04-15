import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { createSquad, getUserSquads, joinSquad } from "@/lib/services/squadService";
import { Squad } from "@/types/squads";

export default function Social() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [squad, setSquad] = useState<Squad | null>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);

    const [createName, setCreateName] = useState("");
    const [createWeeklyGoal, setCreateWeeklyGoal] = useState("");
    const [joinCode, setJoinCode] = useState("");

    const canSubmitCreate = useMemo(() => {
        return createName.trim().length > 0 && Number(createWeeklyGoal) > 0;
    }, [createName, createWeeklyGoal]);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        loadSquad();
    }, [user?.id]);

    async function loadSquad() {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await getUserSquads(user.id);
            setSquad(data.squads[0] ?? null);
        } catch (error: any) {
            Alert.alert("Could not load squad", error?.message || "Try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateSquad() {
        if (!user?.id || !canSubmitCreate) return;

        try {
            setCreating(true);
            await createSquad({
                user_id: user.id,
                squad_name: createName.trim(),
                weekly_goal: Number(createWeeklyGoal),
            });

            setShowCreateModal(false);
            setCreateName("");
            setCreateWeeklyGoal("");
            await loadSquad();
        } catch (error: any) {
            Alert.alert("Could not create squad", error?.message || "Try again.");
        } finally {
            setCreating(false);
        }
    }

    async function handleJoinSquad() {
        if (!user?.id || !joinCode.trim()) return;

        try {
            setJoining(true);
            await joinSquad({
                user_id: user.id,
                invite_code: joinCode.trim().toUpperCase(),
            });

            setShowJoinModal(false);
            setJoinCode("");
            await loadSquad();
        } catch (error: any) {
            Alert.alert("Could not join squad", error?.message || "Try again.");
        } finally {
            setJoining(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator />
            </View>
        );
    }

    if (!squad) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Squads</Text>
                <Text style={styles.subtitle}>
                    Team up with friends to keep your streak alive.
                </Text>

                <Pressable style={styles.primaryButton} onPress={() => setShowCreateModal(true)}>
                    <Text style={styles.primaryButtonText}>Create Squad</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={() => setShowJoinModal(true)}>
                    <Text style={styles.secondaryButtonText}>Join Squad</Text>
                </Pressable>

                <CreateSquadModal
                    visible={showCreateModal}
                    loading={creating}
                    squadName={createName}
                    weeklyGoal={createWeeklyGoal}
                    onChangeSquadName={setCreateName}
                    onChangeWeeklyGoal={setCreateWeeklyGoal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateSquad}
                    canSubmit={canSubmitCreate}
                />

                <JoinSquadModal
                    visible={showJoinModal}
                    loading={joining}
                    inviteCode={joinCode}
                    onChangeInviteCode={setJoinCode}
                    onClose={() => setShowJoinModal(false)}
                    onSubmit={handleJoinSquad}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{squad.name}</Text>

            <View style={styles.streakCard}>
                <Text style={styles.flame}>🔥</Text>
                <View>
                    <Text style={styles.streakValue}>{squad.current_streak}</Text>
                    <Text style={styles.streakLabel}>Current Streak</Text>
                </View>
                <View style={styles.goalPill}>
                    <Text style={styles.goalText}>Goal: {squad.weekly_goal}/week</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Members</Text>
            {squad.members.map((member) => (
                <View key={member.user_id} style={styles.memberRow}>
                    <View>
                        <Text style={styles.memberName}>{member.user_id}</Text>
                        <Text style={styles.memberRole}>{member.role || "member"}</Text>
                    </View>
                    <Text style={styles.memberProgress}>
                        {member.workouts_this_week}/{squad.weekly_goal}
                    </Text>
                </View>
            ))}
        </View>
    );
}

type CreateSquadModalProps = {
    visible: boolean;
    loading: boolean;
    squadName: string;
    weeklyGoal: string;
    onChangeSquadName: (value: string) => void;
    onChangeWeeklyGoal: (value: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    canSubmit: boolean;
};

function CreateSquadModal(props: CreateSquadModalProps) {
    return (
        <Modal visible={props.visible} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Create Squad</Text>
                    <TextInput
                        value={props.squadName}
                        onChangeText={props.onChangeSquadName}
                        placeholder="Squad name"
                        style={styles.input}
                    />
                    <TextInput
                        value={props.weeklyGoal}
                        onChangeText={props.onChangeWeeklyGoal}
                        placeholder="Weekly goal"
                        keyboardType="number-pad"
                        style={styles.input}
                    />

                    <Pressable
                        style={[styles.primaryButton, (!props.canSubmit || props.loading) && styles.disabled]}
                        onPress={props.onSubmit}
                        disabled={!props.canSubmit || props.loading}
                    >
                        <Text style={styles.primaryButtonText}>
                            {props.loading ? "Creating..." : "Create"}
                        </Text>
                    </Pressable>
                    <Pressable style={styles.linkButton} onPress={props.onClose}>
                        <Text style={styles.linkButtonText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

type JoinSquadModalProps = {
    visible: boolean;
    loading: boolean;
    inviteCode: string;
    onChangeInviteCode: (value: string) => void;
    onClose: () => void;
    onSubmit: () => void;
};

function JoinSquadModal(props: JoinSquadModalProps) {
    return (
        <Modal visible={props.visible} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Join Squad</Text>
                    <TextInput
                        value={props.inviteCode}
                        onChangeText={props.onChangeInviteCode}
                        placeholder="Invite code"
                        autoCapitalize="characters"
                        maxLength={6}
                        style={styles.input}
                    />

                    <Pressable
                        style={[styles.primaryButton, (!props.inviteCode.trim() || props.loading) && styles.disabled]}
                        onPress={props.onSubmit}
                        disabled={!props.inviteCode.trim() || props.loading}
                    >
                        <Text style={styles.primaryButtonText}>
                            {props.loading ? "Joining..." : "Join"}
                        </Text>
                    </Pressable>
                    <Pressable style={styles.linkButton} onPress={props.onClose}>
                        <Text style={styles.linkButtonText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f7f7f7",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f7f7f7",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 8,
    },
    subtitle: {
        color: "#6b7280",
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: "#2563eb",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 10,
    },
    primaryButtonText: {
        color: "white",
        fontWeight: "700",
    },
    secondaryButton: {
        backgroundColor: "white",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    secondaryButtonText: {
        color: "#111827",
        fontWeight: "600",
    },
    streakCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    flame: {
        fontSize: 28,
    },
    streakValue: {
        fontSize: 24,
        fontWeight: "700",
        lineHeight: 28,
    },
    streakLabel: {
        color: "#6b7280",
    },
    goalPill: {
        marginLeft: "auto",
        backgroundColor: "#eff6ff",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    goalText: {
        color: "#1d4ed8",
        fontWeight: "600",
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
    },
    memberRow: {
        backgroundColor: "white",
        borderRadius: 10,
        padding: 14,
        marginBottom: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    memberName: {
        fontWeight: "600",
    },
    memberRole: {
        color: "#6b7280",
        marginTop: 2,
        textTransform: "capitalize",
    },
    memberProgress: {
        fontWeight: "700",
        color: "#111827",
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    modalCard: {
        width: "86%",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 10,
    },
    linkButton: {
        alignItems: "center",
        paddingVertical: 8,
    },
    linkButtonText: {
        color: "#4b5563",
        fontWeight: "600",
    },
    disabled: {
        opacity: 0.6,
    },
});