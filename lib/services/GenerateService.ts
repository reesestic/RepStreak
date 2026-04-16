import { Exercise } from "@/lib/models/Exercise";

export class GenerateService {
    static generateWorkout({ exercises, muscles, timeMinutes }: {
        exercises: Exercise[];
        muscles: string[];
        timeMinutes: number;
    }): Exercise[] {
        const timePerExercise = 6;
        const total = Math.floor(timeMinutes / timePerExercise);

        const groups: Record<string, Exercise[]> = {};
        muscles.forEach((m) => {
            // ✅ FIXED: was e.muscleGroup, correct field is primary_muscle
            groups[m] = exercises.filter(e => e.primary_muscle === m);
        });

        const pools = muscles.map(m => [...(groups[m] ?? [])]);
        const workout: Exercise[] = [];

        while (workout.length < total) {
            let added = false;
            for (const pool of pools) {
                if (pool.length && workout.length < total) {
                    const index = Math.floor(Math.random() * pool.length);
                    workout.push(pool.splice(index, 1)[0]);
                    added = true;
                }
            }
            if (!added) break;
        }

        return workout;
    }
}