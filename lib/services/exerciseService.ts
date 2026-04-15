import { supabase } from "@/lib/supabase";
import { Exercise } from "@/lib/models/Exercise";

export async function getExercisesByMuscles(muscles: string[]): Promise<Exercise[]> {
    const normalized = muscles.map(m => m.toLowerCase());

    const { data, error } = await supabase
        .from("Exercises")
        .select("*")
        .in("primary_muscle", normalized);

    if (error) throw error;

    // 🔥 RAW DB ROWS → Exercise objects
    return (data ?? []).map((row: any) => new Exercise(row));
}