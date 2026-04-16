const PREFIXES = [
    "lifter",
    "athlete",
    "gainz",
    "beast",
    "swole",
    "iron",
    "rep",
    "grind",
    "flex",
    "core",
];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pseudo-random handle for new users (e.g. lifter842, athlete1299). */
export function generateRandomUsername(): string {
    const prefix = PREFIXES[randomInt(0, PREFIXES.length - 1)];
    const suffix = randomInt(10, 9999);
    return `${prefix}${suffix}`;
}
