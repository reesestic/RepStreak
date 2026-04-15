import { supabase } from "@/lib/supabase";
import { Exercise } from "@/lib/models/Exercise";

export async function getRecommendedWeight(userId: string, exercise: Exercise): Promise<number> {
    const { data: history } = await supabase
        .from("WorkoutExercises")
        .select(`
            Exercises (primary_muscle, movement_category, equipment_type),
            Sets (weight),
            WorkoutSessions!inner (user_id)
        `)
        .eq("WorkoutSessions.user_id", userId)
        .limit(50);

    if (!history?.length) return fallbackWeight(exercise);

    const matches = history.filter((h: any) => {
        const ex = Array.isArray(h.Exercises) ? h.Exercises[0] : h.Exercises;
        return ex?.primary_muscle === exercise.muscleGroup &&
            ex?.movement_category === exercise.movementCategory;
    });

    if (!matches.length) return fallbackWeight(exercise);

    const best = matches[matches.length - 1];
    const validSets = (best.Sets || []).filter((s: any) => s.weight != null);

    if (!validSets.length) return fallbackWeight(exercise);

    const avg = validSets.reduce((sum: number, s: any) => sum + s.weight, 0) / validSets.length;
    let weight = avg;

    const ex = Array.isArray(best.Exercises) ? best.Exercises[0] : best.Exercises;
    if (ex?.equipment_type !== exercise.equipmentType) {
        if (exercise.equipmentType === "dumbbell") weight *= 0.8;
        if (exercise.equipmentType === "machine")  weight *= 0.9;
        if (exercise.equipmentType === "cable")    weight *= 0.9;
    }

    return Math.round(Math.max(5, weight));
}

function fallbackWeight(exercise: Exercise): number {
    const base: Record<string, number> = {
        chest: 135, back: 135, biceps: 40,
        triceps: 50, shoulders: 40, legs: 185,
    };
    return base[exercise.muscleGroup] ?? 100;
}