import { Set } from "./Set";
import { Exercise } from "./Exercise";

export class WorkoutExercise {
    workoutExerciseId: string;
    workoutId: string;
    exerciseId: string;
    orderIndex: number;
    suggestedWeight: number;
    suggestedReps: number;
    suggestedSets: number;
    sets: Set[];
    exercise?: Exercise;

    constructor(raw: any) {
        this.workoutExerciseId = raw.id ?? crypto.randomUUID();
        this.workoutId = raw.workoutId ?? "";
        this.exerciseId = raw.exerciseId;
        this.orderIndex = raw.orderIndex ?? 0;
        this.suggestedWeight = raw.suggestedWeight ?? 0;
        this.suggestedReps = raw.suggestedReps ?? 10;
        this.suggestedSets = raw.suggestedSets ?? 3;
        this.sets = raw.sets ?? [];
        this.exercise = raw.exercise;
    }

    logSet(weight: number, reps: number): Set {
        const newSet = new Set({
            workoutExerciseId: this.workoutExerciseId,
            setNumber: this.sets.length + 1,
            weight,
            reps,
        });
        this.sets.push(newSet);
        return newSet;
    }

    getSets(): Set[] { return this.sets; }
    getNextSetNumber(): number { return this.sets.length + 1; }
    calculateVolume(): number {
        return this.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
    }

    // 🔥 for router params (can't pass class instances through JSON)
    toPlain() {
        return {
            id: this.workoutExerciseId,
            exerciseId: this.exerciseId,
            orderIndex: this.orderIndex,
            suggestedWeight: this.suggestedWeight,
            suggestedReps: this.suggestedReps,
            suggestedSets: this.suggestedSets,
            name: this.exercise?.name,
            primary_muscle: this.exercise?.muscleGroup,
            movement_category: this.exercise?.movementCategory,
            equipment_type: this.exercise?.equipmentType,
            recommendedWeight: this.suggestedWeight,
            targetReps: this.suggestedReps,
        };
    }
}