import { supabase } from "@/lib/supabase";

export interface DashboardStats {
    currentStreak: number;
    workoutsThisWeek: number;
    workoutDoneToday: boolean;
    lastWorkoutAt: Date | null;
    totalWorkouts: number;
}

/** Returns a YYYY-MM-DD key in the user's local timezone. */
function localDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function startOfWeek(now: Date): Date {
    // Week starts Sunday for simplicity.
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

function computeStreak(dateKeys: Set<string>, now: Date): number {
    if (!dateKeys.size) return 0;

    const todayKey = localDateKey(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = localDateKey(yesterday);

    // The streak is only "alive" if the user worked out today OR yesterday.
    let cursor: Date;
    if (dateKeys.has(todayKey)) {
        cursor = new Date(now);
    } else if (dateKeys.has(yesterdayKey)) {
        cursor = yesterday;
    } else {
        return 0;
    }

    let streak = 0;
    while (dateKeys.has(localDateKey(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

export class DashboardService {
    static async getStats(userId: string): Promise<DashboardStats> {
        const { data, error } = await supabase
            .from("WorkoutSessions")
            .select("id,started_at,completed")
            .eq("user_id", userId)
            .eq("completed", true)
            .order("started_at", { ascending: false })
            .limit(200);

        if (error) throw error;

        const now = new Date();
        const weekStart = startOfWeek(now);
        const todayKey = localDateKey(now);

        const dateKeys = new Set<string>();
        let workoutsThisWeek = 0;
        let lastWorkoutAt: Date | null = null;

        for (const row of data ?? []) {
            const started = row.started_at ? new Date(row.started_at) : null;
            if (!started || isNaN(started.getTime())) continue;

            dateKeys.add(localDateKey(started));
            if (!lastWorkoutAt || started > lastWorkoutAt) {
                lastWorkoutAt = started;
            }
            if (started >= weekStart) {
                workoutsThisWeek += 1;
            }
        }

        return {
            currentStreak: computeStreak(dateKeys, now),
            workoutsThisWeek,
            workoutDoneToday: dateKeys.has(todayKey),
            lastWorkoutAt,
            totalWorkouts: (data ?? []).length,
        };
    }
}
