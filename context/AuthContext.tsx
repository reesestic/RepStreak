import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ProfileService } from "@/lib/services/profileService";

const AuthContext = createContext<any>(null);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // load session
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
            setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null);
        });

        return () => sub.subscription.unsubscribe();
    }, []);

    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    }

    async function signUp(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        if (data.user) {
            try {
                await ProfileService.ensureProfile(data.user.id);
            } catch {
                // Row may be created after email confirmation or on first Profile load.
            }
        }
    }

    async function signOut() {
        await supabase.auth.signOut();
    }

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}