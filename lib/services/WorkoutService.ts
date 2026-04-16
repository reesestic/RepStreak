import { supabase } from "@/lib/supabase";
import { Exercise } from "@/lib/models/Exercise";
import { WorkoutExercise } from "@/lib/models/WorkoutExercise";
import { WorkoutSession } from "@/lib/models/WorkoutSession";
import { WorkoutSet } from "@/lib/models/WorkoutSet";

export class WorkoutService {

    // 🔥 Generate WorkoutExercises with weight recommendations
    static async generateWithWeights(
        userId: string,
        exercises: Exercise[]
    ): Promise<WorkoutExercise[]> {
        return Promise.all(
            exercises.map(async (ex, index) => {
                const weight = await WorkoutService.getRecommendedWeight(userId, ex);
                const reps = WorkoutService.getDefaultReps(ex);

                // ✅ FIXED: constructor keys now match what WorkoutExercise expects
                return new WorkoutExercise({
                    session_id: "",         // filled in when session is saved
                    exercise_id: ex.id,
                    order_index: index,
                    suggestedWeight: weight,
                    suggestedReps: reps,
                    suggestedSets: 3,
                    exercise: ex,
                });
            })
        );
    }

    static async saveFromLog(userId: string, log: any[]): Promise<void> {

        // 1. Create session
        const session = new WorkoutSession({
            user_id: userId,
            started_at: new Date().toISOString(),
            completed: true,
        });

        // 2. Build WorkoutExercises
        const workoutExercises: WorkoutExercise[] = log.map((entry, index) => {
            const we = new WorkoutExercise({
                session_id: session.workoutId,
                exercise_id: entry.exercise.id,
                order_index: index,
            });

            // 3. Build Sets
            const sets = entry.sets.map((s: any) =>
                new WorkoutSet({
                    workout_exercise_id: we.id,
                    reps: s.reps,
                    weight: s.weight,
                    rest_seconds: 60,
                })
            );

            we.sets = sets;
            return we;
        });

        session.workoutExercises = workoutExercises;

        // 4. Mark complete
        session.complete();

        // 5. Save all
        await WorkoutService.saveSession(session);
    }

    // 🔥 Save a completed WorkoutSession + its exercises + sets to Supabase
    static async saveSession(session: WorkoutSession): Promise<void> {
        const { error: sessionError } = await supabase
            .from("WorkoutSessions")
            .insert(session.toPlain());

        if (sessionError) throw sessionError;

        for (const we of session.workoutExercises) {
            const wePlain = { ...we.toPlain(), session_id: session.workoutId };

            const { error: weError } = await supabase
                .from("WorkoutExercises")
                .insert(wePlain);

            if (weError) throw weError;

            for (const s of we.getSets()) {
                const { error: setError } = await supabase
                    .from("Sets")
                    .insert(s.toPlain());

                if (setError) throw setError;
            }
        }
    }

    // 🔥 Recommend a weight based on history
    private static async getRecommendedWeight(
        userId: string,
        exercise: Exercise
    ): Promise<number> {
        const { data: history } = await supabase
            .from("WorkoutExercises")
            .select(`
                Exercises (primary_muscle, movement_category, equipment_type),
                Sets (weight),
                WorkoutSessions!inner (user_id)
            `)
            .eq("WorkoutSessions.user_id", userId)
            .limit(50);

        if (!history?.length) return WorkoutService.fallbackWeight(exercise);

        // ✅ FIXED: was exercise.muscleGroup / movementCategory — correct fields used
        const matches = history.filter((h: any) => {
            const ex = Array.isArray(h.Exercises) ? h.Exercises[0] : h.Exercises;
            return ex?.primary_muscle === exercise.primary_muscle &&
                ex?.movement_category === exercise.movement_category;
        });

        if (!matches.length) return WorkoutService.fallbackWeight(exercise);

        const best = matches[matches.length - 1];
        const validSets = (best.Sets || []).filter((s: any) => s.weight != null);

        if (!validSets.length) return WorkoutService.fallbackWeight(exercise);

        const avg = validSets.reduce((sum: number, s: any) => sum + s.weight, 0) / validSets.length;
        let weight = avg;

        const ex = Array.isArray(best.Exercises) ? best.Exercises[0] : best.Exercises;
        // ✅ FIXED: was exercise.equipmentType — correct field is equipment_type
        if (ex?.equipment_type !== exercise.equipment_type) {
            if (exercise.equipment_type === "dumbbell") weight *= 0.8;
            if (exercise.equipment_type === "machine")  weight *= 0.9;
            if (exercise.equipment_type === "cable")    weight *= 0.9;
        }

        return Math.round(Math.max(5, weight));
    }

    private static fallbackWeight(exercise: Exercise): number {
        const base: Record<string, number> = {
            chest: 135, back: 135, biceps: 40,
            triceps: 50, shoulders: 40, legs: 185,
        };
        // ✅ FIXED: was exercise.muscleGroup
        return base[exercise.primary_muscle] ?? 100;
    }

    private static getDefaultReps(ex: Exercise): number {
        // ✅ FIXED: was ex.movementCategory
        const type = ex.movement_category;
        if (type.includes("compound")) return 6;
        if (type.includes("pull")) return 8;
        if (type.includes("push")) return 8;
        return 10;
    }
}