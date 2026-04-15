export const SPLITS = {
    "Push / Pull / Legs": [
        ["chest", "shoulders", "triceps"],
        ["back", "biceps"],
        ["quads", "hamstrings", "glutes"],
    ],

    "Upper / Lower": [
        ["chest", "back", "shoulders", "biceps", "triceps"],
        ["quads", "hamstrings", "glutes"],
    ],

    Arnold: [
        ["chest", "back"],
        ["arms"],
        ["legs"],
        ["chest", "back"],
        ["arms"],
        ["legs"],
    ],
} as const;

export type SplitType = keyof typeof SPLITS;