import { useState } from "react";
import { View } from "react-native";
import WorkoutCard from "../components/workout/WorkoutCard";
import WorkoutComplete from "../components/workout/WorkoutComplete";

const exercises = [
    {
        id: "1",
        name: "Bench Press",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        targetSets: 3,
        targetReps: 8,
    },
    {
        id: "2",
        name: "Incline DB Press",
        image: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e",
        targetSets: 3,
        targetReps: 8,
    },
    {
        id: "3",
        name: "Squat",
        image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e",
        targetSets: 3,
        targetReps: 8,
    },
];

export default function Workout() {
    const [index, setIndex] = useState(0);
    const [log, setLog] = useState<any[]>([]);
    const [complete, setComplete] = useState(false);

    const current = exercises[index];
    const next = exercises[index + 1];

    function handleFinish(sets: any[]) {
        setLog([...log, { exercise: current, sets }]);

        if (index < exercises.length - 1) {
            setIndex(index + 1);
        } else {
            setComplete(true);
        }
    }

    function handleSkip() {
        setLog([...log, { exercise: current, sets: [] }]);

        if (index < exercises.length - 1) {
            setIndex(index + 1);
        } else {
            setComplete(true);
        }
    }

    if (complete) {
        return <WorkoutComplete log={log} />;
    }

    return (
        <View style={{ flex: 1, justifyContent: "center" }}>
            <WorkoutCard
                key={current.id}
                exercise={current}
                exerciseNumber={index + 1}
                totalExercises={exercises.length}
                nextExerciseName={next?.name}
                onFinish={handleFinish}
                onSkip={handleSkip}
            />
        </View>
    );
}