export type SquadMember = {
    user_id: string;
    role: string | null;
    workouts_this_week: number;
};

export type Squad = {
    id: string;
    name: string;
    invite_code: string;
    weekly_goal: number;
    current_streak: number;
    members: SquadMember[];
};

export type UserSquadsResponse = {
    user_id: string;
    squads: Squad[];
};

export type CreateSquadRequest = {
    user_id: string;
    squad_name: string;
    weekly_goal: number;
};

export type CreateSquadResponse = {
    squad_id: string;
    squad_name: string;
    invite_code: string;
};

export type JoinSquadRequest = {
    user_id: string;
    invite_code: string;
};

export type JoinSquadResponse = {
    joined: boolean;
    already_member: boolean;
    squad_id: string;
    squad_name: string;
};
