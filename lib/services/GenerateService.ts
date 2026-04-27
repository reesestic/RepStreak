import { Exercise } from "@/lib/models/Exercise";
const MAX_PER_MUSCLE = 3;
const MAX_EXERCISES = 12;

export class GenerateService {
    static generateWorkout({ exercises, muscles, timeMinutes }: {
        exercises: Exercise[];
        muscles: string[];
        timeMinutes: number;
    }): Exercise[] {
        const timePerExercise = 6;

        let total = Math.floor(timeMinutes / timePerExercise);

        total = Math.min(total, MAX_EXERCISES);

        const groups: Record<string, Exercise[]> = {};
        muscles.forEach((m) => {
            groups[m] = exercises.filter(e => e.primary_muscle === m);
        });

        const pools = muscles.map(m => [...(groups[m] ?? [])]);
        const countPerMuscle: Record<string, number> = {};
        const workout: Exercise[] = [];

        while (workout.length < total) {
            let added = false;
            for (let i = 0; i < muscles.length; i++) {
                const muscle = muscles[i];
                const pool = pools[i];
                const count = countPerMuscle[muscle] ?? 0;

                if (pool.length && workout.length < total && count < MAX_PER_MUSCLE) {
                    const ex = pool.shift()!;
                    workout.push(ex);
                    countPerMuscle[muscle] = count + 1;
                    added = true;
                }
            }
            if (!added) break;
        }

        return workout;
    }
}