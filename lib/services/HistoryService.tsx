import { supabase } from "@/lib/supabase";
import { Exercise } from "@/lib/models/Exercise";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseSummary {
    exercise: Exercise;
    times_completed: number;  // total rows in WorkoutExercises for this exercise
    pr_weight: number;        // max single-set weight ever lifted
}

export interface SessionPoint {
    session_id: string;
    started_at: string;
    avg_weight: number;
    avg_reps: number;
    set_count: number;
}

// ─── Muscle colours ───────────────────────────────────────────────────────────

const MUSCLE_COLORS: Record<string, { bg: string; text: string }> = {
    chest:     { bg: "#FFE8E8", text: "#C0392B" },
    back:      { bg: "#E8F4FD", text: "#1A6FA3" },
    legs:      { bg: "#E8F8EE", text: "#1E8449" },
    shoulders: { bg: "#FDF5E8", text: "#B7770D" },
    biceps:    { bg: "#F3E8FF", text: "#7D3C98" },
    triceps:   { bg: "#FDE8F5", text: "#A03080" },
    core:      { bg: "#E8FDF5", text: "#1A8A6A" },
    glutes:    { bg: "#FFF0E8", text: "#C05A1A" },
};

export function muscleColor(muscle: string) {
    return MUSCLE_COLORS[muscle?.toLowerCase()] ?? { bg: "#F0F0F0", text: "#555" };
}

// ─── HistoryService ───────────────────────────────────────────────────────────

export class HistoryService {

    // How it works:
    //
    // 1. Fetch every WorkoutExercises row that belongs to this user's sessions,
    //    joined with Exercises (for name/muscle) and Sets (for PR weight).
    //    We do NOT filter by session_id being non-null — we want all rows.
    //
    // 2. Group by exercise_id in JS:
    //    - times_completed = number of WorkoutExercises rows for that exercise
    //    - pr_weight = max weight across all Sets on any of those rows
    //
    // 3. Sort by times_completed descending, return top 20.
    //
    // Note: rows with session_id = null are included — they represent exercises
    // added to a workout that wasn't formally started as a session, and they
    // still count as "done".

    static async getExerciseHistory(userId: string): Promise<ExerciseSummary[]> {

        // Query A: rows WITH a session (join to verify user ownership)
        const { data: withSession, error: errA } = await supabase
            .from("WorkoutExercises")
            .select(`
                id,
                exercise_id,
                Exercises ( * ),
                Sets ( weight ),
                WorkoutSessions!session_id ( user_id )
            `)
            .eq("WorkoutSessions.user_id", userId);

        if (errA) throw errA;

        // Group by exercise_id
        const map = new Map<string, {
            exercise: Exercise;
            count: number;
            pr_weight: number;
        }>();

        for (const row of withSession ?? []) {
            const session = row.WorkoutSessions as any;
            // Only count rows that belong to this user's sessions
            if (!session || session.user_id !== userId) continue;

            const rawEx = row.Exercises as any;
            if (!rawEx) continue;

            const sets = (row.Sets as any[]) ?? [];
            const maxInRow = sets.reduce((m: number, s: any) => {
                const w = typeof s.weight === "number" ? s.weight : 0;
                return w > m ? w : m;
            }, 0);

            const existing = map.get(row.exercise_id);
            if (existing) {
                existing.count += 1;
                if (maxInRow > existing.pr_weight) existing.pr_weight = maxInRow;
            } else {
                map.set(row.exercise_id, {
                    exercise: new Exercise(rawEx),
                    count: 1,
                    pr_weight: maxInRow,
                });
            }
        }

        const summaries: ExerciseSummary[] = Array.from(map.values()).map((v) => ({
            exercise: v.exercise,
            times_completed: v.count,
            pr_weight: v.pr_weight,
        }));

        summaries.sort((a, b) => b.times_completed - a.times_completed);
        return summaries.slice(0, 20);
    }

    // For the chart screen: one data point per session this exercise appeared in.
    // x = session date, y = avg weight of all sets in that session.

    static async getSessionPoints(
        userId: string,
        exerciseId: string
    ): Promise<SessionPoint[]> {
        const { data, error } = await supabase
            .from("WorkoutExercises")
            .select(`
                session_id,
                Sets ( weight, reps ),
                WorkoutSessions!session_id ( started_at, user_id )
            `)
            .eq("exercise_id", exerciseId)
            .not("session_id", "is", null); // only sessions with dates for the chart

        if (error) throw error;

        const sessionMap = new Map<string, {
            started_at: string;
            weights: number[];
            reps: number[];
        }>();

        for (const row of data ?? []) {
            const session = row.WorkoutSessions as any;
            if (!session || session.user_id !== userId) continue;

            const sets = (row.Sets as any[]) ?? [];
            const weights = sets.map((s: any) => s.weight).filter((w: any) => typeof w === "number" && w > 0);
            const reps    = sets.map((s: any) => s.reps).filter((r: any) => typeof r === "number" && r > 0);

            const existing = sessionMap.get(row.session_id);
            if (existing) {
                existing.weights.push(...weights);
                existing.reps.push(...reps);
            } else {
                sessionMap.set(row.session_id, {
                    started_at: session.started_at,
                    weights,
                    reps,
                });
            }
        }

        const avg = (arr: number[]) =>
            arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        const points: SessionPoint[] = Array.from(sessionMap.entries()).map(
            ([session_id, v]) => ({
                session_id,
                started_at: v.started_at,
                avg_weight: Math.round(avg(v.weights) * 10) / 10,
                avg_reps:   Math.round(avg(v.reps)    * 10) / 10,
                set_count:  v.weights.length,
            })
        );

        points.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
        return points;
    }
}