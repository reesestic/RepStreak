export class Exercise {
    id: string;
    name: string;

    primary_muscle: string;
    secondary_muscles: string[];

    movement_category: string;
    equipment_type: string;
    difficulty: string;
    is_compound: boolean;

    created_at?: Date;

    constructor(raw: any) {
        this.id = raw.id;
        this.name = raw.name;

        this.primary_muscle = raw.primary_muscle;
        this.secondary_muscles = raw.secondary_muscles ?? [];

        this.movement_category = raw.movement_category ?? "";
        this.equipment_type = raw.equipment_type ?? "";
        this.difficulty = raw.difficulty ?? "";

        this.is_compound = raw.is_compound ?? false;

        this.created_at = raw.created_at
            ? new Date(raw.created_at)
            : undefined;
    }

    static getByMuscleGroup(exercises: Exercise[], group: string): Exercise[] {
        return exercises.filter(e => e.primary_muscle === group);
    }

    static getById(exercises: Exercise[], id: string): Exercise | undefined {
        return exercises.find(e => e.id === id);
    }

    toPlain() {
        return {
            id: this.id,
            name: this.name,
            primary_muscle: this.primary_muscle,
            secondary_muscles: this.secondary_muscles,
            movement_category: this.movement_category,
            equipment_type: this.equipment_type,
            difficulty: this.difficulty,
            is_compound: this.is_compound,
        };
    }
}