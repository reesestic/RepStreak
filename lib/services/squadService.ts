import {
    CreateSquadRequest,
    JoinSquadRequest,
} from "@/types/squads";
import { Squad, SquadRaw } from "@/lib/models/Squad";

const MOCK_SQUAD_ID = "mock-squad-001";

function buildMockSquad(userId: string, squadName = "Rep Warriors", weeklyGoal = 4): SquadRaw {
    return {
        id: MOCK_SQUAD_ID,
        name: squadName,
        invite_code: "FIT123",
        weekly_goal: weeklyGoal,
        current_streak: 5,
        members: [
            { user_id: userId, role: "leader", workouts_this_week: 4, profile_name: "Member A" },
            { user_id: "member-b-id", role: "member", workouts_this_week: 2, profile_name: "Member B" },
            { user_id: "member-c-id", role: "member", workouts_this_week: 0, profile_name: "Member C" },
        ],
    };
}

export async function getUserSquads(userId: string): Promise<Squad[]> {
    return [new Squad(buildMockSquad(userId, "Rep Warriors", 10))];
}

export async function createSquad(payload: CreateSquadRequest): Promise<Squad> {
    return new Squad(buildMockSquad(payload.user_id, payload.squad_name, payload.weekly_goal));
}

export async function joinSquad(payload: JoinSquadRequest): Promise<Squad> {
    return new Squad(buildMockSquad(payload.user_id, "Rep Warriors", 10));
}
