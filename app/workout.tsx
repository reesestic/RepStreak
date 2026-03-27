import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkoutCard from "../components/workout/WorkoutCard";
import WorkoutComplete from "../components/workout/WorkoutComplete";

import benchPress from "../assets/images/bench-press.jpg";
import inclinePress from "../assets/images/incline-bench-press.jpg";
import chestFly from "../assets/images/chest-fly.jpg";
import pullUps from "../assets/images/pull-ups.jpg";
import cableRows from "../assets/images/cable-row.jpg";
import latPulldown from "../assets/images/lat-pulldown.jpg";

const initialExercises = [
    { id: "1", name: "Chest Press", image: benchPress, targetSets: 4, targetReps: 8 },
    { id: "2", name: "Incline Chest Press", image: inclinePress, targetSets: 3, targetReps: 10 },
    { id: "3", name: "Chest Fly", image: chestFly, targetSets: 3, targetReps: 12 },
    { id: "4", name: "Pull Ups", image: pullUps, targetSets: 4, targetReps: 8 },
    { id: "5", name: "Cable Rows", image: cableRows, targetSets: 3, targetReps: 10 },
    { id: "6", name: "Lat Pulldowns", image: latPulldown, targetSets: 3, targetReps: 12 },
];

export default function Workout() {
    const [exercises, setExercises] = useState(initialExercises);
    const [index, setIndex] = useState(0);
    const [log, setLog] = useState<any[]>([]);
    const [complete, setComplete] = useState(false);

    const current = exercises[index];
    const next = exercises[index + 1];

    function handleFinish(sets: any[]) {
        setLog([...log, {exercise: current, sets}]);
        if (index < exercises.length - 1) {
            setIndex(index + 1);
        } else {
            setComplete(true);
        }
    }

    function handleSkip() {
        setLog([...log, {exercise: current, sets: []}]);
        if (index < exercises.length - 1) {
            setIndex(index + 1);
        } else {
            setComplete(true);
        }
    }

    function handleReorder(reordered: typeof initialExercises) {
        // keep completed exercises + current, replace upcoming with reordered
        const newList = [...exercises.slice(0, index + 1), ...reordered];
        setExercises(newList);
    }

    if (complete) {
        return <WorkoutComplete log={log}/>;
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: "#05070A", justifyContent: "center"}}>
            <WorkoutCard
                key={current.id}
                exercise={current}
                exerciseNumber={index + 1}
                totalExercises={exercises.length}
                nextExerciseName={next?.name}
                upcomingExercises={exercises.slice(index + 1)}
                onReorder={handleReorder}
                onFinish={handleFinish}
                onSkip={handleSkip}
            />
        </SafeAreaView>
    );
}