import { WorkoutSet } from "./WorkoutSet";
import { Exercise } from "./Exercise";

export class WorkoutExercise {
    id: string;
    session_id: string;
    exercise_id: string;
    order_index: number;
    created_at?: Date;

    suggestedWeight?: number;
    suggestedReps?: number;
    suggestedSets?: number;

    sets?: WorkoutSet[];
    exercise?: Exercise;

    constructor(raw: any) {
        this.id = raw.id;
        this.session_id = raw.session_id;
        this.exercise_id = raw.exercise_id;
        this.order_index = raw.order_index ?? 0;

        this.created_at = raw.created_at
            ? new Date(raw.created_at)
            : undefined;

        this.suggestedWeight = raw.suggestedWeight;
        this.suggestedReps = raw.suggestedReps;
        this.suggestedSets = raw.suggestedSets;

        this.sets = raw.sets;
        this.exercise = raw.exercise;
    }

    logSet(weight: number, reps: number): WorkoutSet {
        const newSet = new WorkoutSet({
            workout_exercise_id: this.id,
            reps,
            weight,
            rest_seconds: 60,
        });

        if (!this.sets) this.sets = [];
        this.sets.push(newSet);

        return newSet;
    }

    getSets(): WorkoutSet[] {
        return this.sets ?? [];
    }

    getNextSetNumber(): number {
        return (this.sets?.length ?? 0) + 1;
    }

    calculateVolume(): number {
        if (!this.sets) return 0;
        return this.sets.reduce((sum, s) => sum + s.calculateVolume(), 0);
    }

    // 🔥 For Supabase — DB columns only
    toPlain() {
        return {
            id: this.id,
            session_id: this.session_id,
            exercise_id: this.exercise_id,
            order_index: this.order_index,
        };
    }

    // 🔥 For router params — includes UI fields and exercise display data
    toRoutePlain() {
        return {
            id: this.id,
            session_id: this.session_id,
            exercise_id: this.exercise_id,
            order_index: this.order_index,
            suggestedWeight: this.suggestedWeight,
            suggestedReps: this.suggestedReps,
            suggestedSets: this.suggestedSets,
            name: this.exercise?.name,
            primary_muscle: this.exercise?.primary_muscle,
        };
    }
}