import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    Button,
    ActivityIndicator,
    Pressable,
    StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

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

    // 🔥 Run both when screen focuses
    useFocusEffect(
        useCallback(() => {
            loadProfile();
            loadStats();
        }, [loadProfile, loadStats])
    );

    // 🔥 Navigation (CORRECT)
    function handleStartWorkout() {
        router.push("/constraints");
    }

    const todayLabel = todayMuscles
        ? todayMuscles.map(m => m[0].toUpperCase() + m.slice(1)).join(" & ")
        : null;

    const streak = stats?.currentStreak ?? 0;
    const workoutsThisWeek = stats?.workoutsThisWeek ?? 0;
    const doneToday = !!stats?.workoutDoneToday;

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
                        <View style={{ flex: 1 }}>
                            <Text style={styles.streakValue}>
                                {streak} {streak === 1 ? "day" : "days"}
                            </Text>
                            <Text style={styles.streakLabel}>
                                {doneToday
                                    ? "Streak extended!"
                                    : "Work out today to keep it alive"}
                            </Text>
                        </View>
                    </View>

                    {/* 🔥 Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{workoutsThisWeek}</Text>
                            <Text>This Week</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {stats?.totalWorkouts ?? 0}
                            </Text>
                            <Text>Total</Text>
                        </View>
                    </View>

                    {/* 🔥 Today */}
                    <View style={styles.todayCard}>
                        <Text style={styles.todayLabel}>Today's Workout</Text>
                        <Text style={styles.todayTitle}>
                            {todayLabel ?? "Loading..."}
                        </Text>

                        <Pressable style={styles.primaryButton} onPress={handleStartWorkout}>
                            <Text style={{ color: "white", fontWeight: "700" }}>
                                Start Workout
                            </Text>
                        </Pressable>
                    </View>
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
        marginBottom: 12,
    },
    streakFlame: {
        fontSize: 36,
        marginRight: 12,
    },
    streakValue: {
        fontSize: 22,
        fontWeight: "800",
    },
    streakLabel: {
        color: "#6b7280",
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
    },
    statValue: {
        fontSize: 22,
        fontWeight: "800",
    },
    todayCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
    },
    todayLabel: {
        color: "#6b7280",
        marginBottom: 4,
    },
    todayTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: "#2563eb",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
});