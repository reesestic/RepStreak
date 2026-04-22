export type ChallengeType = "visits" | "volume" | "reps";

export type ChallengeParticipantRaw = {
    user_id: string;
    progress?: number | null;
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

    constructor(raw: ChallengeParticipantRaw) {
        this.userId = String(raw.user_id ?? "");
        this.progress = Number(raw.progress ?? 0);
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
}
