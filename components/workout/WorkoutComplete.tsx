import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function WorkoutComplete({ log }: any) {
    const router = useRouter();

    function goHome() {
        router.replace("/"); // 🔥 go back to Home
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>Workout Complete 🎉</Text>
            <Text>Total Exercises: {log.length}</Text>

            <View style={{ marginTop: 20 }}>
                <Button title="Go Home" onPress={goHome} />
            </View>
        </View>
    );
}
// get rid of + button functionality theres no need
//remove do set, jsut ahv estart set and finish set and an aiblity to remove sets
// if u skip then subtaract from total so at end it show u u did two
// if u skip show the oines at end and dont dispaly it