export const MUSCLE_GROUPS = {
    push: ["chest", "shoulders", "triceps"],
    pull: ["back", "biceps"],
    legs: ["quads", "hamstrings", "glutes", "calves"],
    arms: ["biceps", "triceps", "shoulders"],
    upper: ["chest", "back", "shoulders", "biceps", "triceps"],
    lower: ["quads", "hamstrings", "glutes", "calves"],
} as const;

export function expandMuscles(muscles: string[]): string[] {
    return Array.from(
        new Set(
            muscles.flatMap((m) =>
                MUSCLE_GROUPS[m as keyof typeof MUSCLE_GROUPS] ?? [m]
            )
        )
    );
}