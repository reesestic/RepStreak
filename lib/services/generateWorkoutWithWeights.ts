import { Exercise } from "@/lib/models/Exercise"
import { WorkoutExercise } from "@/lib/models/WorkoutExercise";
import { getRecommendedWeight } from "@/lib/services/recommendationEngine";

export async function generateWorkoutWithWeights(
    userId: string,
    exercises: Exercise[]
): Promise<WorkoutExercise[]> {

    const results = await Promise.all(
        exercises.map(async (ex, index) => {
            const weight = await getRecommendedWeight(userId, ex);
            const reps = getDefaultReps(ex);

            // 🔥 Create a WorkoutExercise (the link between Workout + Exercise)
            return new WorkoutExercise({
                exerciseId: ex.exerciseId,
                workoutId: "",           // filled in when session is saved
                orderIndex: index,
                suggestedWeight: weight,
                suggestedReps: reps,
                suggestedSets: 3,
                // carry the full exercise data for display
                exercise: ex,
            });
        })
    );

    return results;
}

function getDefaultReps(ex: Exercise): number {
    const type = ex.movementCategory;
    if (type.includes("compound")) return 6;
    if (type.includes("pull")) return 8;
    if (type.includes("push")) return 8;
    return 10;
}