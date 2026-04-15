import { View, TextInput, Button, StyleSheet } from "react-native";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",   // centers vertically
        padding: 20,
        backgroundColor: "#fff",
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: "#fff",
    },
});

export default function Login() {
    const { signIn, signUp } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin() {
        try {
            await signIn(email, password);
            router.replace("/"); // go to home
        } catch (e: any) {
            alert(e.message);
        }
    }

    async function handleSignup() {
        try {
            await signUp(email, password);
            alert("Check your email!");
        } catch (e: any) {
            alert(e.message);
        }
    }

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
            />

            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />

            <View style={{ marginTop: 10 }}>
                <Button title="Login" onPress={handleLogin} />
            </View>

            <View style={{ marginTop: 10 }}>
                <Button title="Sign Up" onPress={handleSignup} />
            </View>
        </View>
    );
}