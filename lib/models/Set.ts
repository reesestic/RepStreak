export class Set {
    setId: string;
    workoutExerciseId: string;
    setNumber: number;
    reps: number;
    weight: number;
    restSeconds: number;
    isPersonalRecord: boolean;
    completedAt: Date;

    constructor(raw: any) {
        this.setId = raw.id ?? crypto.randomUUID();
        this.workoutExerciseId = raw.workoutExerciseId ?? raw.workout_exercise_id;
        this.setNumber = raw.setNumber ?? raw.set_number ?? 1;
        this.reps = raw.reps ?? 0;
        this.weight = raw.weight ?? 0;
        this.restSeconds = raw.restSeconds ?? raw.rest_seconds ?? 60;
        this.isPersonalRecord = raw.isPersonalRecord ?? false;
        this.completedAt = new Date(raw.completedAt ?? Date.now());
    }

    calculateVolume(): number {
        return this.reps * this.weight;
    }

    setsPersonalRecord(isRecord: boolean) {
        this.isPersonalRecord = isRecord;
    }
}