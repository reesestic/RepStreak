import { SplitType } from "@/lib/splits";


export class Profile {
    userId: string;
    username: string;
    height: number;
    weight: number;
    age: number;

    sex?: string;
    experienceLevel?: string;
    workoutSplit?: SplitType;
    preferredRestSeconds?: number;
    splitIndex?: number;

    createdAt?: string;

    constructor(raw: any) {
        this.userId = raw.id;
        this.username = raw.username;
        this.height = raw.height;
        this.weight = raw.weight;
        this.age = raw.age;

        this.sex = raw.sex;
        this.experienceLevel = raw.experience_level;
        this.workoutSplit = raw.workout_split as SplitType | undefined;
        this.preferredRestSeconds = raw.preferred_rest_seconds;
        this.splitIndex = raw.split_index;

        this.createdAt = raw.created_at;
    }

    // frontend changes before user confirms
    updateProfile(profileData: Partial<Profile>) {
        Object.assign(this, profileData);
    }

    getNextWorkoutDay(splitLength: number) {
        const index = this.splitIndex ?? 0;
        return (index % splitLength) + 1;
    }

    toPlain() {
        return {
            id: this.userId,
            username: this.username,
            height: this.height,
            weight: this.weight,
            age: this.age,
            sex: this.sex,
            experience_level: this.experienceLevel,
            workout_split: this.workoutSplit,
            preferred_rest_seconds: this.preferredRestSeconds,
            split_index: this.splitIndex,
        };
    }
}