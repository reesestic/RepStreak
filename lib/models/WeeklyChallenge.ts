export type ChallengeType = "visits" | "volume" | "reps";

export type ChallengeParticipantRaw = {
    user_id: string;
    progress?: number | null;
    profile_name?: string | null;
};

export type WeeklyChallengeRaw = {
    id: string;
    squad_id: string;
    name: string;
    target_goal: number;
    challenge_type?: string | null;
    duration_days?: number | null;
    is_active?: boolean | null;
    created_by: string;
    created_at?: string | null;
    ends_at?: string | null;
    participants?: ChallengeParticipantRaw[] | null;
};

const CHALLENGE_UNIT_LABELS: Record<ChallengeType, string> = {
    visits: "Visits",
    volume: "Lbs",
    reps: "Reps",
};

const CHALLENGE_DISPLAY_LABELS: Record<ChallengeType, string> = {
    visits: "Consistency (Visits)",
    volume: "Volume (Lbs)",
    reps: "Targeted (Reps)",
};

export const CHALLENGE_TYPES: ChallengeType[] = ["visits", "volume", "reps"];

export function getChallengeUnitLabel(type: ChallengeType): string {
    return CHALLENGE_UNIT_LABELS[type];
}

export function getChallengeDisplayLabel(type: ChallengeType): string {
    return CHALLENGE_DISPLAY_LABELS[type];
}

function normalizeChallengeType(value: string | null | undefined): ChallengeType {
    if (value === "volume" || value === "reps") return value;
    return "visits";
}

export class ChallengeParticipant {
    userId: string;
    progress: number;
    profileName: string | null;

    constructor(raw: ChallengeParticipantRaw) {
        this.userId = String(raw.user_id ?? "");
        this.progress = Number(raw.progress ?? 0);
        this.profileName = raw.profile_name ?? null;
    }
}

export class WeeklyChallenge {
    id: string;
    squadId: string;
    name: string;
    targetGoal: number;
    challengeType: ChallengeType;
    durationDays: number;
    isActive: boolean;
    createdBy: string;
    createdAt: string | null;
    endsAt: string | null;
    participants: ChallengeParticipant[];

    constructor(raw: WeeklyChallengeRaw) {
        this.id = String(raw.id ?? "");
        this.squadId = String(raw.squad_id ?? "");
        this.name = raw.name ?? "";
        this.targetGoal = Number(raw.target_goal ?? 0);
        this.challengeType = normalizeChallengeType(raw.challenge_type);
        this.durationDays = Number(raw.duration_days ?? 7);
        this.isActive = raw.is_active ?? true;
        this.createdBy = String(raw.created_by ?? "");
        this.createdAt = raw.created_at ?? null;
        this.endsAt = raw.ends_at ?? null;
        this.participants = Array.isArray(raw.participants)
            ? raw.participants.map((p) => new ChallengeParticipant(p))
            : [];
    }

    /** Returns true if the given user is currently opted in to this challenge. */
    getParticipantStatus(userId: string | null | undefined): boolean {
        if (!userId) return false;
        return this.participants.some((p) => p.userId === userId);
    }

    get participantCount(): number {
        return this.participants.length;
    }

    getTotalProgress(): number {
        return this.participants.reduce((sum, p) => sum + p.progress, 0);
    }

    getCompletionPercentage(): number {
        if (this.targetGoal <= 0) return 0;
        return Math.min(100, Math.round((this.getTotalProgress() / this.targetGoal) * 100));
    }

    /** Human-readable unit ("Visits", "Lbs", "Reps") for this challenge. */
    getUnitLabel(): string {
        return getChallengeUnitLabel(this.challengeType);
    }

    /**
     * Formatted goal with the correct unit, e.g.
     *   visits  -> "12 Visits"
     *   volume  -> "50,000 Lbs"
     *   reps    -> "200 Reps"
     */
    getFormattedGoal(): string {
        const formatted = this.targetGoal.toLocaleString();
        return `${formatted} ${this.getUnitLabel()}`;
    }

    /** Formats a raw progress value with this challenge's unit (e.g. "5,200 Lbs"). */
    formatProgress(progress: number): string {
        return `${Number(progress || 0).toLocaleString()} ${this.getUnitLabel()}`;
    }

    /** Participants sorted by progress descending (leaderboard order). */
    getLeaderboard(): ChallengeParticipant[] {
        return [...this.participants].sort((a, b) => b.progress - a.progress);
    }

    /**
     * Milliseconds remaining until this challenge ends.
     * Falls back to `created_at + duration_days` if `ends_at` is not set.
     * Returns 0 once the window has passed.
     */
    getMillisRemaining(now: Date = new Date()): number {
        let endsAt: Date | null = null;
        if (this.endsAt) {
            const parsed = new Date(this.endsAt);
            if (!isNaN(parsed.getTime())) endsAt = parsed;
        }
        if (!endsAt && this.createdAt) {
            const start = new Date(this.createdAt);
            if (!isNaN(start.getTime())) {
                endsAt = new Date(
                    start.getTime() + this.durationDays * 24 * 60 * 60 * 1000,
                );
            }
        }
        if (!endsAt) return 0;
        return Math.max(0, endsAt.getTime() - now.getTime());
    }

    /**
     * Human-readable time-remaining label, e.g.
     *   "Ends in 5 days"
     *   "Ends in 12 hours"
     *   "Ends in 30 minutes"
     *   "Ended"
     */
    getTimeRemainingLabel(now: Date = new Date()): string {
        const ms = this.getMillisRemaining(now);
        if (ms <= 0) return "Ended";

        const minutes = Math.floor(ms / (60 * 1000));
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));

        if (days >= 1) return `Ends in ${days} ${days === 1 ? "day" : "days"}`;
        if (hours >= 1) return `Ends in ${hours} ${hours === 1 ? "hour" : "hours"}`;
        if (minutes >= 1)
            return `Ends in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
        return "Ends in <1 minute";
    }

    hasEnded(now: Date = new Date()): boolean {
        return this.getMillisRemaining(now) <= 0;
    }
}
