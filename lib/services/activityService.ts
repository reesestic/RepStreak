const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type CompleteWorkoutPayload = {
    user_id: string;
    visits?: number;
    total_reps?: number;
    total_volume?: number;
};

export type CompleteWorkoutResult = {
    user_id: string;
    squads_updated: number;
    challenges_updated: number;
};

/**
 * Tells the backend that a workout session was completed so it can:
 *  - bump `workouts_this_week` on every squad the user belongs to (UC3 Visits)
 *  - advance progress on every active challenge the user is opted into,
 *    using the metric matching each challenge's `challenge_type`.
 *
 * Fire-and-forget semantics: the caller should not block the workout save
 * flow on this. Errors are swallowed and logged so a network hiccup doesn't
 * fail the user's main save.
 */
export async function reportCompletedWorkout(
    payload: CompleteWorkoutPayload,
): Promise<CompleteWorkoutResult | null> {
    if (!API_BASE_URL) {
        console.warn("[activityService] Missing EXPO_PUBLIC_API_BASE_URL; skipping workout report.");
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/workouts/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                visits: 1,
                total_reps: 0,
                total_volume: 0,
                ...payload,
            }),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            console.warn(
                "[activityService] complete_workout failed:",
                body?.detail || response.statusText,
            );
            return null;
        }
        return (await response.json()) as CompleteWorkoutResult;
    } catch (error) {
        console.warn("[activityService] complete_workout error:", error);
        return null;
    }
}
