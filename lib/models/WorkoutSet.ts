export class WorkoutSet {
    id: string;
    workout_exercise_id: string;
    reps: number;
    weight: number;
    rest_seconds: number;
    created_at: Date;

    // UI-only
    setNumber?: number;
    isPersonalRecord?: boolean;

    constructor(raw: any) {
        this.id = raw.id ?? crypto.randomUUID();
        this.workout_exercise_id = raw.workout_exercise_id;

        this.reps = raw.reps ?? 0;
        this.weight = raw.weight ?? 0;
        this.rest_seconds = raw.rest_seconds ?? 60;

        this.created_at = new Date(raw.created_at ?? Date.now());

        this.setNumber = raw.setNumber;
        this.isPersonalRecord = raw.isPersonalRecord;
    }

    calculateVolume(): number {
        return this.reps * this.weight;
    }

    setPersonalRecord(isRecord: boolean) {
        this.isPersonalRecord = isRecord;
    }

    toPlain() {
        return {
            id: this.id,
            workout_exercise_id: this.workout_exercise_id,
            reps: this.reps,
            weight: this.weight,
            rest_seconds: this.rest_seconds,
            created_at: this.created_at.toISOString(),
        };
    }
}