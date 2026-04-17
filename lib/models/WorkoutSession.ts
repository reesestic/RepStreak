import { WorkoutExercise } from "./WorkoutExercise";

export class WorkoutSession {
    workoutId: string;
    userId: string;

    startedAt: Date;
    endedAt?: Date;

    durationMinutes: number;
    completed: boolean;

    workoutExercises: WorkoutExercise[];

    // UI-only
    totalVolume?: number;

    constructor(raw: any) {
        this.workoutId = raw.id;
        this.userId = raw.user_id;

        this.startedAt = new Date(raw.started_at ?? Date.now());
        this.endedAt = raw.ended_at ? new Date(raw.ended_at) : undefined;

        this.durationMinutes = raw.duration_minutes ?? 0;
        this.completed = raw.completed ?? false;

        this.workoutExercises = raw.workoutExercises ?? [];

        this.totalVolume = raw.totalVolume;
    }

    addExercise(exercise: WorkoutExercise) {
        this.workoutExercises.push(exercise);
    }

    complete() {
        this.completed = true;
        this.endedAt = new Date();
        this.totalVolume = this.calculateTotalVolume();
    }

    calculateTotalVolume(): number {
        return this.workoutExercises.reduce(
            (sum, we) => sum + we.calculateVolume(),
            0
        );
    }

    getWorkoutExercises(): WorkoutExercise[] {
        return this.workoutExercises;
    }

    toPlain() {
        return {
            id: this.workoutId,
            user_id: this.userId,
            started_at: this.startedAt.toISOString(),
            ended_at: this.endedAt?.toISOString(),
            duration_minutes: this.durationMinutes,
            completed: this.completed,
        };
    }
}