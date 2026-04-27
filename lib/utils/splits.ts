export const SPLITS = {
    "Push / Pull / Legs": [
        ["push"],
        ["pull"],
        ["legs"],
    ],

    "Upper / Lower": [
        ["upper"],
        ["lower"],
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