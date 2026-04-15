import { WorkoutExercise } from "./WorkoutExercise";

export class Workout {
    workoutId: string;
    userId: string;
    date: Date;
    totalVolume: number;
    duration: number;
    status: "pending" | "active" | "complete";
    splitFocus: string;
    workoutExercises: WorkoutExercise[];

    constructor(raw: any) {
        this.workoutId = raw.id ?? crypto.randomUUID();
        this.userId = raw.userId;
        this.date = new Date(raw.date ?? Date.now());
        this.totalVolume = raw.totalVolume ?? 0;
        this.duration = raw.duration ?? 0;
        this.status = raw.status ?? "pending";
        this.splitFocus = raw.splitFocus ?? "";
        this.workoutExercises = raw.workoutExercises ?? [];
    }

    addExercise(exercise: WorkoutExercise) {
        this.workoutExercises.push(exercise);
    }

    complete() {
        this.status = "complete";
        this.totalVolume = this.calculateTotalVolume();
    }

    calculateTotalVolume(): number {
        return this.workoutExercises.reduce((sum, we) => sum + we.calculateVolume(), 0);
    }

    getWorkoutExercises(): WorkoutExercise[] {
        return this.workoutExercises;
    }
}