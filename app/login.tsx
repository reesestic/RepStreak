// import { View, TextInput, Button } from "react-native";
// import { useState } from "react";
// import { useAuth } from "./AuthContext";
// import { useRouter } from "expo-router";
//
// export default function Login() {
//     const { signIn, signUp } = useAuth();
//     const router = useRouter();
//
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//
//     async function handleLogin() {
//         try {
//             await signIn(email, password);
//         } catch (e: any) {
//             alert(e.message);
//         }
//     }
//
//     async function handleSignup() {
//         try {
//             await signUp(email, password);
//             alert("Check your email!");
//         } catch (e: any) {
//             alert(e.message);
//         }
//     }
//
//     return (
//         <View style={{ padding: 20 }}>
//             <TextInput placeholder="Email" onChangeText={setEmail} />
//             <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
//
//             <Button title="Login" onPress={handleLogin} />
//             <Button title="Sign Up" onPress={handleSignup} />
//         </View>
//     );
// }