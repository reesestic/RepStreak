
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
