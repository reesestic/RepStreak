// import { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "./supabase";
//
// type AuthContextType = {
//     user: any;
//     loading: boolean;
//     signIn: (email: string, password: string) => Promise<void>;
//     signUp: (email: string, password: string) => Promise<void>;
//     signOut: () => Promise<void>;
// };
//
// const AuthContext = createContext<AuthContextType | null>(null);
//
// export function useAuth() {
//     const ctx = useContext(AuthContext);
//     if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
//     return ctx;
// }
//
// export function AuthProvider({ children }: { children: React.ReactNode }) {
//     const [user, setUser] = useState<any>(null);
//     const [loading, setLoading] = useState(true);
//
//     useEffect(() => {
//         supabase.auth.getSession().then(({ data }) => {
//             setUser(data.session?.user ?? null);
//             setLoading(false);
//         });
//
//         const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
//             setUser(session?.user ?? null);
//         });
//
//         return () => sub.subscription.unsubscribe();
//     }, []);
//
//     async function signIn(email: string, password: string) {
//         const { error } = await supabase.auth.signInWithPassword({
//             email,
//             password,
//         });
//         if (error) throw error;
//     }
//
//     async function signUp(email: string, password: string) {
//         const { error } = await supabase.auth.signUp({
//             email,
//             password,
//         });
//         if (error) throw error;
//     }
//
//     async function signOut() {
//         await supabase.auth.signOut();
//     }
//
//     return (
//         <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
//             {children}
//         </AuthContext.Provider>
//     );
// }