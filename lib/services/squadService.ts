import {
    CreateSquadRequest,
    CreateSquadResponse,
    JoinSquadRequest,
    JoinSquadResponse,
    UserSquadsResponse,
} from "@/types/squads";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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

export async function getUserSquads(userId: string): Promise<UserSquadsResponse> {
    return fetchJson<UserSquadsResponse>(`/squads/${userId}`);
}

export async function createSquad(payload: CreateSquadRequest): Promise<CreateSquadResponse> {
    return fetchJson<CreateSquadResponse>("/squads/create", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function joinSquad(payload: JoinSquadRequest): Promise<JoinSquadResponse> {
    return fetchJson<JoinSquadResponse>("/squads/join", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
