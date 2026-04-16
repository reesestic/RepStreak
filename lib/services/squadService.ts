import {
    CreateSquadResponse,
    CreateSquadRequest,
    JoinSquadResponse,
    JoinSquadRequest,
} from "@/types/squads";
import { Squad, SquadRaw } from "@/lib/models/Squad";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type GetUserSquadsResponse = {
    user_id: string;
    squads: SquadRaw[];
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

export async function getUserSquads(userId: string): Promise<Squad[]> {
    const payload = await fetchJson<GetUserSquadsResponse>(`/squads/${userId}`);
    return (payload.squads || []).map((item) => new Squad(item));
}

export async function createSquad(payload: CreateSquadRequest): Promise<Squad> {
    await fetchJson<CreateSquadResponse>("/squads/create", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    const squads = await getUserSquads(payload.user_id);
    if (!squads.length) {
        throw new Error("Squad created but could not load squad data.");
    }
    return squads[0];
}

export async function joinSquad(payload: JoinSquadRequest): Promise<Squad> {
    await fetchJson<JoinSquadResponse>("/squads/join", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    const squads = await getUserSquads(payload.user_id);
    if (!squads.length) {
        throw new Error("Joined squad but could not load squad data.");
    }
    return squads[0];
}
