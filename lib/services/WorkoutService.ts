import { supabase } from "@/lib/supabase";
import { Exercise } from "@/lib/models/Exercise";
import { WorkoutExercise } from "@/lib/models/WorkoutExercise";
import { WorkoutSession } from "@/lib/models/WorkoutSession";
import { WorkoutSet } from "@/lib/models/WorkoutSet";

export class WorkoutService {

    static async generateWithWeights(
        userId: string,
        exercises: Exercise[]
    ): Promise<WorkoutExercise[]> {
        return Promise.all(
            exercises.map(async (ex, index) => {
                const weight = await WorkoutService.getRecommendedWeight(userId, ex);
                const reps = WorkoutService.getDefaultReps(ex);

                return new WorkoutExercise({
                    session_id: "",
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
        const completedLog = log.filter(entry => entry.sets.length > 0);

        const session = new WorkoutSession({
            user_id: userId,
            started_at: new Date().toISOString(),
            completed: true,
        });

        const workoutExercises: WorkoutExercise[] = completedLog.map((entry, index) => {
            const we = new WorkoutExercise({
                session_id: "", // will be set later
                exercise_id: entry.exercise.id,
                order_index: index,
            });

            const sets = entry.sets.map((s: any) =>
                new WorkoutSet({
                    workout_exercise_id: "", // will be set after insert
                    reps: s.reps,
                    weight: s.weight,
                    rest_seconds: 60,
                })
            );

            we.sets = sets;
            return we;
        });

        session.workoutExercises = workoutExercises;
        session.complete();

        await WorkoutService.saveSession(session);
    }

    static async saveSession(session: WorkoutSession): Promise<void> {

        // ✅ 1. Insert session and get REAL ID
        const { data: sessionData, error: sessionError } = await supabase
            .from("WorkoutSessions")
            .insert(session.toPlain())
            .select()
            .single();

        if (sessionError) throw sessionError;

        const sessionId = sessionData.id;

        // ✅ 2. Insert WorkoutExercises with correct session_id
        for (const we of session.workoutExercises) {
            const wePlain = {
                ...we.toPlain(),
                session_id: sessionId,
            };

            const { data: weData, error: weError } = await supabase
                .from("WorkoutExercises")
                .insert(wePlain)
                .select()
                .single();

            if (weError) throw weError;

            const workoutExerciseId = weData.id;

            // ✅ 3. Insert Sets with correct workout_exercise_id
            for (const s of we.getSets()) {
                const { error: setError } = await supabase
                    .from("Sets")
                    .insert({
                        ...s.toPlain(),
                        workout_exercise_id: workoutExerciseId,
                    });

                if (setError) throw setError;
            }
        }
    }

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
        return base[exercise.primary_muscle] ?? 100;
    }

    private static getDefaultReps(ex: Exercise): number {
        const type = ex.movement_category;
        if (type.includes("compound")) return 6;
        if (type.includes("pull")) return 8;
        if (type.includes("push")) return 8;
        return 10;
    }
}