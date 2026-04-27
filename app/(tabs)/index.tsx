import React, { useState, useCallback } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { ProfileService } from "@/lib/services/profileService";
import { SPLITS, SplitType } from "@/lib/utils/splits";
import { DashboardService, DashboardStats } from "@/lib/services/DashboardService";

export default function Home() {
    const router = useRouter();
    const { user } = useAuth();

    const [username, setUsername] = useState("");
    const [todayMuscles, setTodayMuscles] = useState<string[] | null>(null);

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // 🔥 Load profile + split
    const loadProfile = useCallback(async () => {
        if (!user?.id) return;

        const p = await ProfileService.ensureProfile(user.id);
        setUsername(p.username?.trim() || "Athlete");

        if (p.workoutSplit && p.workoutSplit in SPLITS) {
            const splitDays = SPLITS[p.workoutSplit as SplitType];
            const index = (p.splitIndex ?? 0) % splitDays.length;
            setTodayMuscles([...splitDays[index]] as string[]);
        }
    }, [user?.id]);

    // 🔥 Load dashboard stats
    const loadStats = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const next = await DashboardService.getStats(user.id);
            setStats(next);
        } catch (error) {
            console.warn("[Home] Failed to load dashboard stats:", error);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
            loadStats();
        }, [loadProfile, loadStats])
    );

    // 🔥 ALWAYS go to constraints
    function handleStartWorkout() {
        router.push("/constraints");
    }

    const streak = stats?.currentStreak ?? 0;
    const workoutsThisWeek = stats?.workoutsThisWeek ?? 0;
    const doneToday = !!stats?.workoutDoneToday;

    const todayLabel = todayMuscles
        ? todayMuscles.map(m => m[0].toUpperCase() + m.slice(1)).join(" & ")
        : "Loading...";

    return (
        <View style={styles.container}>
            <Text style={styles.greeting}>
                Welcome back{username ? `, ${username}` : ""} 👋
            </Text>

            {loading && !stats ? (
                <ActivityIndicator />
            ) : (
                <>
                    {/* 🔥 Streak */}
                    <View style={styles.streakCard}>
                        <Text style={styles.streakFlame}>🔥</Text>
                        <View style={styles.streakTextColumn}>
                            <Text style={styles.streakValue}>
                                {streak}{" "}
                                <Text style={styles.streakUnit}>
                                    {streak === 1 ? "day" : "days"}
                                </Text>
                            </Text>
                            <Text style={styles.streakLabel}>
                                {streak === 0
                                    ? "Start your streak today"
                                    : doneToday
                                        ? "Streak extended for today!"
                                        : "Work out today to keep it alive"}
                            </Text>
                        </View>
                    </View>

                    {/* 🔥 Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{workoutsThisWeek}</Text>
                            <Text style={styles.statLabel}>This Week</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {stats?.totalWorkouts ?? 0}
                            </Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                    </View>

                    {/* 🔥 Today */}
                    {doneToday ? (
                        <View style={styles.doneCard}>
                            <Text style={styles.doneIcon}>✅</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.doneTitle}>
                                    Workout logged for today
                                </Text>
                                <Text style={styles.doneSubtitle}>
                                    {stats?.lastWorkoutAt
                                        ? `Finished at ${stats.lastWorkoutAt.toLocaleTimeString([], {
                                            hour: "numeric",
                                            minute: "2-digit",
                                        })}`
                                        : "Great job! Rest up."}
                                </Text>
                            </View>

                            {/* still goes to constraints */}
                            <Pressable
                                style={styles.secondaryButton}
                                onPress={handleStartWorkout}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    Extra Session
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.todayCard}>
                            <Text style={styles.todayLabel}>Today's Workout</Text>
                            <Text style={styles.todayTitle}>{todayLabel}</Text>

                            <Pressable
                                style={styles.primaryButton}
                                onPress={handleStartWorkout}
                            >
                                <Text style={styles.primaryButtonText}>
                                    Start Workout
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </>
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
    greeting: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 16,
    },
    streakCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 12,
    },
    streakFlame: { fontSize: 36 },
    streakTextColumn: { flex: 1 },
    streakValue: { fontSize: 28, fontWeight: "800" },
    streakUnit: { fontSize: 16, fontWeight: "600", color: "#6b7280" },
    streakLabel: { color: "#6b7280", marginTop: 2 },

    statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    statCard: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
    },
    statValue: { fontSize: 22, fontWeight: "800" },
    statLabel: {
        color: "#6b7280",
        marginTop: 2,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },

    doneCard: {
        backgroundColor: "#ecfdf5",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: "#a7f3d0",
    },
    doneIcon: { fontSize: 28 },
    doneTitle: { fontWeight: "700", color: "#065f46" },
    doneSubtitle: { color: "#047857", fontSize: 12 },

    todayCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
    },
    todayLabel: {
        color: "#6b7280",
        fontSize: 12,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    todayTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },

    primaryButton: {
        backgroundColor: "#2563eb",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    primaryButtonText: { color: "white", fontWeight: "700" },

    secondaryButton: {
        backgroundColor: "white",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#a7f3d0",
    },
    secondaryButtonText: {
        color: "#065f46",
        fontWeight: "700",
        fontSize: 12,
    },
});