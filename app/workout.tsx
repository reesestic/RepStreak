import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkoutCard from "../components/workout/WorkoutCard";
import WorkoutComplete from "../components/workout/WorkoutComplete";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { WorkoutService } from "@/lib/services/WorkoutService";
import {SPLITS, SplitType} from "@/lib/utils/splits";

export default function Workout() {
    const { workout } = useLocalSearchParams();

    const parsedWorkout = workout
        ? JSON.parse(workout as string).map((we: any, i: number) => ({
            id: we.id ?? `temp-${i}`,
            exercise_id: we.exercise_id,
            name: we.name ?? "Exercise",
            targetReps: we.suggestedReps ?? 10,
            targetSets: we.suggestedSets ?? 3,
            recommendedWeight: we.suggestedWeight ?? null,
            image: null,
        }))
        : [];

    const [exercises, setExercises] = useState(parsedWorkout);
    const [index, setIndex] = useState(0);
    const [log, setLog] = useState<any[]>([]);
    const [complete, setComplete] = useState(false);

    useEffect(() => {
        if (!complete) return;

        async function save() {
            const { data: { user } } = await supabase.auth.getUser();
            try {
                await WorkoutService.saveFromLog(user!.id, log);

                // Increment split index
                const { data: profile } = await supabase
                    .from("Profiles")
                    .select("split_index, workout_split")
                    .eq("id", user!.id)
                    .single();

                if (profile?.workout_split && profile.workout_split in SPLITS) {
                    const splitLength = SPLITS[profile.workout_split as SplitType].length;
                    const nextIndex = ((profile.split_index ?? 0) + 1) % splitLength;
                    await supabase
                        .from("Profiles")
                        .update({ split_index: nextIndex })
                        .eq("id", user!.id);
                }
            } catch (err) {
                console.error(err);
            }
        }

        save();
    }, [complete, log]);

    const current = exercises[index];
    const next = exercises[index + 1];

    function handleFinish(sets: any[]) {
        const newLog = [
            ...log,
            {
                exercise: {
                    id: current.exercise_id,
                    name: current.name,
                },
                sets,
            },
        ];

        setLog(newLog);

        if (index < exercises.length - 1) {
            setIndex(index + 1);
        } else {
            setComplete(true);
        }
    }

    function handleSkip() {
        const newLog = [
            ...log,
            {
                exercise: {
                    id: current.exercise_id,
                    name: current.name,
                },
                sets: [],
            },
        ];

        setLog(newLog);

        if (index < exercises.length - 1) {
            setIndex(index + 1);
        } else {
            setComplete(true);
        }
    }

    function handleReorder(reordered: any[]) {
        const before = exercises.slice(0, index + 1);
        setExercises([...before, ...reordered]);
    }

    if (complete) {
        return <WorkoutComplete log={log} />;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#05070A", justifyContent: "center" }}>
            <WorkoutCard
                key={current.id ?? index}
                exercise={current}
                nextExerciseName={next?.name}
                upcomingExercises={exercises.slice(index + 1)}
                onReorder={handleReorder}
                onFinish={handleFinish}
                onSkip={handleSkip}
            />
        </SafeAreaView>
    );
}