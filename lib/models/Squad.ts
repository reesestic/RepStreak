export type SquadMember = {
    user_id: string;
    role: string | null;
    workouts_this_week: number;
};

export class Squad {
    id: string;
    name: string;
    inviteCode: string;
    weeklyGoal: number;
    currentStreak: number;
    members: SquadMember[];

    constructor(raw: any) {
        this.id = String(raw.id ?? "");
        this.name = raw.name ?? "";
        this.inviteCode = raw.invite_code ?? "";
        this.weeklyGoal = Number(raw.weekly_goal ?? 0);
        this.currentStreak = Number(raw.current_streak ?? 0);
        this.members = Array.isArray(raw.members) ? raw.members : [];
    }

    getStreakStatus(): "Active" | "At Risk" {
        return this.currentStreak > 0 ? "Active" : "At Risk";
    }

    getCompletionPercentage(): number {
        if (!this.members.length || this.weeklyGoal <= 0) {
            return 0;
        }

        const totalCompleted = this.members.reduce(
            (sum, member) => sum + Number(member.workouts_this_week ?? 0),
            0
        );
        const totalTarget = this.weeklyGoal * this.members.length;
        return Math.min(100, Math.round((totalCompleted / totalTarget) * 100));
    }

    toPlain() {
        return {
            id: this.id,
            name: this.name,
            invite_code: this.inviteCode,
            weekly_goal: this.weeklyGoal,
            current_streak: this.currentStreak,
            members: this.members,
        };
    }
}
