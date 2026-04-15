export type SquadMemberRaw = {
    user_id: string;
    role: string | null;
    workouts_this_week: number;
    profile_name?: string | null;
};

export type SquadRaw = {
    id: string;
    name: string;
    invite_code: string;
    weekly_goal: number;
    current_streak: number;
    members: SquadMemberRaw[];
};

export class SquadMember {
    userId: string;
    role: string | null;
    workoutsThisWeek: number;
    profileName: string | null;

    constructor(raw: SquadMemberRaw) {
        this.userId = String(raw.user_id ?? "");
        this.role = raw.role ?? "member";
        this.workoutsThisWeek = Number(raw.workouts_this_week ?? 0);
        this.profileName = raw.profile_name ?? null;
    }
}

export class Squad {
    id: string;
    name: string;
    inviteCode: string;
    weeklyGoal: number;
    currentStreak: number;
    members: SquadMember[];

    constructor(raw: SquadRaw) {
        this.id = String(raw.id ?? "");
        this.name = raw.name ?? "";
        this.inviteCode = raw.invite_code ?? "";
        this.weeklyGoal = Number(raw.weekly_goal ?? 0);
        this.currentStreak = Number(raw.current_streak ?? 0);
        this.members = Array.isArray(raw.members) ? raw.members.map((m) => new SquadMember(m)) : [];
    }

    get totalSquadWorkouts(): number {
        return this.members.reduce((sum, member) => sum + member.workoutsThisWeek, 0);
    }

    get isGoalMet(): boolean {
        if (this.weeklyGoal <= 0 || this.members.length === 0) return false;
        return this.totalSquadWorkouts >= this.weeklyGoal * this.members.length;
    }

    getStreakStatus(): "Active" | "At Risk" {
        return this.currentStreak > 0 ? "Active" : "At Risk";
    }

    getCompletionPercentage(): number {
        if (this.weeklyGoal <= 0 || this.members.length === 0) return 0;
        const totalGoal = this.weeklyGoal * this.members.length;
        return Math.min(100, Math.round((this.totalSquadWorkouts / totalGoal) * 100));
    }

    getTopScore(): number {
        if (!this.members.length) return 0;
        return this.members.reduce((max, member) => Math.max(max, member.workoutsThisWeek), 0);
    }
}
