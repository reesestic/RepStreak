export class Exercise {
    exerciseId: string;
    name: string;
    muscleGroup: string;
    equipmentType: string;
    movementCategory: string;
    isCompound: boolean;

    constructor(raw: any) {
        this.exerciseId = raw.id;
        this.name = raw.name;
        this.muscleGroup = raw.primary_muscle;
        this.equipmentType = raw.equipment_type ?? "";
        this.movementCategory = raw.movement_category ?? "";
        this.isCompound = raw.is_compound ?? false;
    }

    static getByMuscleGroup(exercises: Exercise[], group: string): Exercise[] {
        return exercises.filter(e => e.muscleGroup === group);
    }

    getById(exercises: Exercise[], id: string): Exercise | undefined {
        return exercises.find(e => e.exerciseId === id);
    }

    toPlain() {
        return {
            id: this.exerciseId,
            name: this.name,
            primary_muscle: this.muscleGroup,
            movement_category: this.movementCategory,
            equipment_type: this.equipmentType,
            is_compound: this.isCompound,
        };
    }
}