import { supabase } from "@/lib/supabase";
import { Exercise } from "@/lib/models/Exercise";

export class ExerciseService {
    static async getByMuscles(muscles: string[]): Promise<Exercise[]> {
        const normalized = muscles.map(m => m.toLowerCase());

        const { data, error } = await supabase
            .from("Exercises")
            .select("*")
            .in("primary_muscle", normalized);

        if (error) throw error;

        return (data ?? []).map((row: any) => new Exercise(row));
    }
}