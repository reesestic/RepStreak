import {
    CreateSquadRequest,
    CreateSquadResponse,
    JoinSquadRequest,
    JoinSquadResponse,
    SquadRaw,
    UserSquadsResponse,
} from "@/types/squads";
import { Squad } from "@/lib/models/Squad";

const MOCK_SQUAD_ID = "mock-squad-001";

function buildMockSquad(userId: string, squadName = "Rep Warriors", weeklyGoal = 4): SquadRaw {
    return {
        id: MOCK_SQUAD_ID,
        name: squadName,
        invite_code: "FIT123",
        weekly_goal: weeklyGoal,
        current_streak: 5,
        members: [
            { user_id: userId, role: "leader", workouts_this_week: 3 },
            { user_id: "5c0b9f0a-f9ea-4c33-9f12-c8ea96b198a7", role: "member", workouts_this_week: 2 },
            { user_id: "abf54e9c-a018-45b1-a0a1-fd1ccf0f2305", role: "member", workouts_this_week: 4 },
        ],
    };
}

export async function getUserSquads(userId: string): Promise<UserSquadsResponse> {
    const mockSquad = new Squad(buildMockSquad(userId));
    return {
        user_id: userId,
        squads: [mockSquad.toPlain()],
    };
}

export async function createSquad(payload: CreateSquadRequest): Promise<CreateSquadResponse> {
    return {
        squad_id: MOCK_SQUAD_ID,
        squad_name: payload.squad_name,
        invite_code: "FIT123",
    };
}

export async function joinSquad(payload: JoinSquadRequest): Promise<JoinSquadResponse> {
    return {
        joined: true,
        already_member: false,
        squad_id: MOCK_SQUAD_ID,
        squad_name: "Rep Warriors",
    };
}
