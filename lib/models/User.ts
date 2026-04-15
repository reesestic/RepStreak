export class User {
    userId: string;
    username: string;
    email?: string;
    height: number;
    weight: number;
    age: number;

    constructor(raw: any) {
        this.userId = raw.id;
        this.username = raw.username;
        this.email = raw.email;
        this.height = raw.height;
        this.weight = raw.weight;
        this.age = raw.age;
    }

    updateProfile(profileData: Partial<User>) {
        Object.assign(this, profileData);
    }

    getWorkoutHistory(): any[] {
        return [];
    }
}