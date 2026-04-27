import { supabase } from "@/lib/supabase";
import { Exercise } from "@/lib/models/Exercise";
import { WorkoutExercise } from "@/lib/models/WorkoutExercise";
import { WorkoutSession } from "@/lib/models/WorkoutSession";
import { WorkoutSet } from "@/lib/models/WorkoutSet";
import { reportCompletedWorkout } from "@/lib/services/activityService";

// Full bidirectional equipment conversion matrix
const EQUIPMENT_CONVERSION: Record<string, Record<string, number>> = {
    barbell:    { dumbbell: 0.75, machine: 0.90, cable: 0.85, bodyweight: 0 },
    dumbbell:   { barbell: 1.33,  machine: 1.10, cable: 1.11, bodyweight: 0 },
    machine:    { barbell: 1.11,  dumbbell: 0.80, cable: 0.95, bodyweight: 0 },
    cable:      { barbell: 1.18,  dumbbell: 0.90, machine: 1.05, bodyweight: 0 },
    bodyweight: { barbell: 0,     dumbbell: 0,    machine: 0,  cable: 0 },
};

function convertWeight(weight: number, from: string, to: string): number {
    if (from === to) return weight;
    if (to === "bodyweight") return 0;
    if (from === "bodyweight") return 0; // no basis
    const factor = EQUIPMENT_CONVERSION[from]?.[to];
    return factor !== undefined ? weight * factor : weight;
}

export class WorkoutService {

    static async generateWithWeights(
        userId: string,
        exercises: Exercise[],
        soreMuscles: string[] = []
    ): Promise<WorkoutExercise[]> {
        return Promise.all(
            exercises.map(async (ex, index) => {
                const isSore = soreMuscles.includes(ex.primary_muscle);
                const weight = await WorkoutService.getRecommendedWeight(userId, ex, isSore);
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

        // Fire-and-forget: notify backend so squad visits + challenge progress
        // auto-update for every active challenge the user is opted into.
        if (completedLog.length > 0) {
            const { totalReps, totalVolume } = WorkoutService.computeWorkoutTotals(completedLog);
            void reportCompletedWorkout({
                user_id: userId,
                visits: 1,
                total_reps: totalReps,
                total_volume: Math.round(totalVolume),
            });
        }
    }

    private static computeWorkoutTotals(
        completedLog: any[],
    ): { totalReps: number; totalVolume: number } {
        let totalReps = 0;
        let totalVolume = 0;
        for (const entry of completedLog) {
            for (const s of entry.sets || []) {
                const reps = Number(s?.reps) || 0;
                const weight = Number(s?.weight) || 0;
                totalReps += reps;
                totalVolume += reps * weight;
            }
        }
        return { totalReps, totalVolume };
    }

    static async saveSession(session: WorkoutSession): Promise<void> {

        //Insert session and get REAL ID
        const { data: sessionData, error: sessionError } = await supabase
            .from("WorkoutSessions")
            .insert(session.toPlain())
            .select()
            .single();

        if (sessionError) throw sessionError;

        const sessionId = sessionData.id;

        //Insert WorkoutExercises with correct session_id
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

            //Insert Sets with correct workout_exercise_id
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
        exercise: Exercise,
        isSore: boolean = false
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

        let weight: number | null = null;

        if (history?.length) {
            // Find entries matching muscle + movement category
            const matches = history.filter((h: any) => {
                const ex = Array.isArray(h.Exercises) ? h.Exercises[0] : h.Exercises;
                return ex?.primary_muscle === exercise.primary_muscle &&
                    ex?.movement_category === exercise.movement_category;
            });

            if (matches.length) {
                const best = matches[matches.length - 1];
                const historyEx = Array.isArray(best.Exercises) ? best.Exercises[0] : best.Exercises;
                const validSets = (best.Sets || []).filter((s: any) => s.weight != null && s.weight > 0);

                if (validSets.length) {
                    const avg = validSets.reduce((sum: number, s: any) => sum + s.weight, 0) / validSets.length;
                    const historyEquip = historyEx?.equipment_type ?? "";
                    const targetEquip = exercise.equipment_type ?? "";

                    weight = convertWeight(avg, historyEquip, targetEquip);
                }
            }
        }

        // Fall back if no history match
        if (weight === null || weight === 0) {
            if (exercise.equipment_type === "bodyweight") return 0;
            weight = WorkoutService.fallbackWeight(exercise);
        }

        // Apply soreness modifier
        if (isSore) weight *= 0.5;

        return Math.round(Math.max(exercise.equipment_type === "bodyweight" ? 0 : 5, weight));
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