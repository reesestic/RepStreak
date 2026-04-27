import React, { useState } from "react";
import { View, Text, Button } from "react-native";
import { useRouter , useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ProfileService } from "@/lib/services/profileService";
import { SPLITS, SplitType } from "@/lib/utils/splits";


export default function Home() {
    const router = useRouter();
    const { user } = useAuth();
    const [username, setUsername] = useState("");
    const [todayMuscles, setTodayMuscles] = useState<string[] | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            if (!user?.id) return;

            let cancelled = false;

            async function load() {
                const p = await ProfileService.ensureProfile(user.id);
                if (cancelled) return;

                setUsername(p.username?.trim() || "Athlete");

                if (p.workoutSplit && p.workoutSplit in SPLITS) {
                    const splitDays = SPLITS[p.workoutSplit as SplitType];
                    const index = (p.splitIndex ?? 0) % splitDays.length;
                    setTodayMuscles([...splitDays[index]] as string[]);
                }
            }

            load();

            return () => {
                cancelled = true;
            };
        }, [user?.id])
    );

    function handleStartWorkout() {
        router.push("/constraints");
    }

    const todayLabel = todayMuscles
        ? todayMuscles.map(m => m[0].toUpperCase() + m.slice(1)).join(" & ")
        : null;

    return (
        <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                Welcome back{username ? `, ${username}` : ""} 👋
            </Text>
            <Text style={{ marginTop: 10, fontSize: 16 }}>
                🔥 Let&#39;s continue your 5-day streak!
            </Text>
            <Text style={{ marginTop: 20, fontSize: 18 }}>
                Today&#39;s Workout:
            </Text>
            {todayLabel ? (
                <Text style={{ fontSize: 22, fontWeight: "600" }}>
                    {todayLabel}
                </Text>
            ) : (
                <Text style={{ fontSize: 16, color: "#888", marginTop: 4 }}>
                    Loading workout split...
                </Text>
            )}
            <View style={{ marginTop: 30 }}>
                <Button title="Start Workout" onPress={handleStartWorkout} />
            </View>
        </View>
    );
}

