import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/models/Profile";

export class ProfileService {

    static async getProfile(userId: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from("Profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error || !data) return null;

        return new Profile(data); // 🔥 normalization
    }

    static async updateProfile(profile: Profile) {
        await supabase
            .from("Profiles")
            .upsert(profile.toPlain()); // 🔥 convert back
    }

}