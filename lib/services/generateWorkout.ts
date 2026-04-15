import { Exercise } from "@/lib/models/Exercise";

export function generateWorkout({
                                    exercises,
                                    muscles,
                                    timeMinutes,
                                }: {
    exercises: Exercise[];
    muscles: string[];
    timeMinutes: number;
}): Exercise[] {

    const timePerExercise = 6;
    const total = Math.floor(timeMinutes / timePerExercise);

    // 🔥 Group exercises by muscle
    const groups: Record<string, Exercise[]> = {};

    muscles.forEach((m) => {
        groups[m] = exercises.filter(e => e.muscleGroup === m);
    });

    const workout: Exercise[] = [];

    // 🔥 Convert groups to array of pools
    const pools = muscles.map(m => [...groups[m]]); // copy to avoid mutation bugs

    // 🔥 Balanced selection (no empty-loop issue)
    while (workout.length < total) {
        let added = false;

        for (const pool of pools) {
            if (pool.length && workout.length < total) {
                const index = Math.floor(Math.random() * pool.length);
                const choice = pool.splice(index, 1)[0];
                workout.push(choice);
                added = true;
            }
        }

        if (!added) break;
    }

    return workout;
}