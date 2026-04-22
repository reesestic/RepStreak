import { ChallengeType, WeeklyChallenge, WeeklyChallengeRaw } from "@/lib/models/WeeklyChallenge";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type ChallengeListPayload = {
    squad_id: string;
    challenges: WeeklyChallengeRaw[];
};

type ParticipationPayload = {
    challenge_id: string;
    user_id: string;
    opted_in: boolean;
};

export type CreateChallengePayload = {
    user_id: string;
    name: string;
    target_goal: number;
    challenge_type: ChallengeType;
    duration_days?: number;
};

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
    if (!API_BASE_URL) {
        throw new Error("Missing EXPO_PUBLIC_API_BASE_URL environment variable.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(body?.detail || "Request failed.");
    }
    return body as T;
}

export async function getSquadChallenges(
    squadId: string,
    activeOnly: boolean = true,
): Promise<WeeklyChallenge[]> {
    const payload = await fetchJson<ChallengeListPayload>(
        `/squads/${squadId}/challenges?active_only=${activeOnly ? "true" : "false"}`,
    );
    return (payload.challenges || []).map((item) => new WeeklyChallenge(item));
}

export async function createChallenge(
    squadId: string,
    payload: CreateChallengePayload,
): Promise<WeeklyChallenge> {
    const body = await fetchJson<WeeklyChallengeRaw>(`/squads/${squadId}/challenges`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return new WeeklyChallenge(body);
}

export async function setChallengeParticipation(
    challengeId: string,
    userId: string,
    optIn: boolean,
): Promise<ParticipationPayload> {
    return await fetchJson<ParticipationPayload>(
        `/challenges/${challengeId}/participation`,
        {
            method: "POST",
            body: JSON.stringify({ user_id: userId, opt_in: optIn }),
        },
    );
}
