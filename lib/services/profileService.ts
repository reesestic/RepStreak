import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/models/Profile";
import { generateRandomUsername } from "@/lib/utils/randomUsername";

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

    /**
     * Ensures a Profiles row exists for this user with a non-empty username.
     * Used after sign-up and for legacy accounts missing personal data.
     */
    static async ensureProfile(userId: string): Promise<Profile> {
        const existing = await ProfileService.getProfile(userId);
        if (existing) {
            if (!existing.username?.trim()) {
                existing.username = generateRandomUsername();
                await ProfileService.updateProfile(existing);
            }
            return existing;
        }

        const profile = new Profile({
            id: userId,
            username: generateRandomUsername(),
            height: 0,
            weight: 0,
            age: 0,
        });
        await ProfileService.updateProfile(profile);
        return profile;
    }

}