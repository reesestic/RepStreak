import os
import random
import string

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv("../.env")


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins, including your local Expo web port
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)


class CreateSquadRequest(BaseModel):
    user_id: str = Field(min_length=1)
    squad_name: str = Field(min_length=1, max_length=100)
    weekly_goal: int = Field(ge=1)


class JoinSquadRequest(BaseModel):
    user_id: str = Field(min_length=1)
    invite_code: str = Field(min_length=6, max_length=6)


class CreateSquadResponse(BaseModel):
    squad_id: str
    squad_name: str
    invite_code: str


class JoinSquadResponse(BaseModel):
    joined: bool
    already_member: bool
    squad_id: str
    squad_name: str


class SquadMemberResponse(BaseModel):
    user_id: str
    role: str | None = None
    workouts_this_week: int
    profile_name: str | None = None


class SquadDetailResponse(BaseModel):
    id: str
    name: str
    invite_code: str
    weekly_goal: int
    current_streak: int
    members: list[SquadMemberResponse]


class UserSquadsResponse(BaseModel):
    user_id: str
    squads: list[SquadDetailResponse]


def generate_invite_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=length))


def fetch_profile_names(user_ids: list[str]) -> dict[str, str]:
    unique = list({uid for uid in user_ids if uid})
    if not unique:
        return {}
    res = (
        supabase.table("Profiles")
        .select("id,username")
        .in_("id", unique)
        .execute()
    )
    out: dict[str, str] = {}
    for row in res.data or []:
        uid = str(row.get("id", ""))
        name = (row.get("username") or "").strip()
        if uid:
            out[uid] = name
    return out


def unique_invite_code() -> str:
    for _ in range(10):
        invite_code = generate_invite_code(6)
        existing = (
            supabase.table("squads")
            .select("id")
            .eq("invite_code", invite_code)
            .limit(1)
            .execute()
        )
        if not existing.data:
            return invite_code
    raise HTTPException(status_code=500, detail="Failed to generate unique invite code.")


@app.post("/squads/create", response_model=CreateSquadResponse)
def create_squad(payload: CreateSquadRequest):
    invite_code = unique_invite_code()

    squad_insert = (
        supabase.table("squads")
        .insert(
            {
                "name": payload.squad_name,
                "invite_code": invite_code,
                "weekly_goal": payload.weekly_goal,
                "current_streak": 0,
                "created_by": payload.user_id,
            }
        )
        .execute()
    )
    if not squad_insert.data:
        raise HTTPException(status_code=500, detail="Could not create squad.")

    squad = squad_insert.data[0]
    membership_insert = (
        supabase.table("squad_members")
        .insert(
            {
                "squad_id": squad["id"],
                "user_id": payload.user_id,
                "role": "admin",
                "workouts_this_week": 0,
            }
        )
        .execute()
    )
    if not membership_insert.data:
        raise HTTPException(status_code=500, detail="Could not add creator to squad.")

    return {
        "squad_id": str(squad["id"]),
        "squad_name": squad["name"],
        "invite_code": squad["invite_code"],
    }


@app.post("/squads/join", response_model=JoinSquadResponse)
def join_squad(payload: JoinSquadRequest):
    invite_code = payload.invite_code.upper()

    squad_result = (
        supabase.table("squads")
        .select("id,name,invite_code")
        .eq("invite_code", invite_code)
        .limit(1)
        .execute()
    )
    if not squad_result.data:
        raise HTTPException(status_code=404, detail="Invalid invite code.")

    squad = squad_result.data[0]
    existing_membership = (
        supabase.table("squad_members")
        .select("id")
        .eq("squad_id", squad["id"])
        .eq("user_id", payload.user_id)
        .limit(1)
        .execute()
    )
    if existing_membership.data:
        return {
            "joined": True,
            "already_member": True,
            "squad_id": str(squad["id"]),
            "squad_name": squad["name"],
        }

    membership_insert = (
        supabase.table("squad_members")
        .insert(
            {
                "squad_id": squad["id"],
                "user_id": payload.user_id,
                "role": "member",
                "workouts_this_week": 0,
            }
        )
        .execute()
    )
    if not membership_insert.data:
        raise HTTPException(status_code=500, detail="Could not join squad.")

    return {
        "joined": True,
        "already_member": False,
        "squad_id": str(squad["id"]),
        "squad_name": squad["name"],
    }


@app.get("/squads/{user_id}", response_model=UserSquadsResponse)
def get_user_squads(user_id: str):
    user_memberships = (
        supabase.table("squad_members")
        .select("squad_id,squads(id,name,invite_code,weekly_goal,current_streak)")
        .eq("user_id", user_id)
        .execute()
    )

    squad_ids = [row["squad_id"] for row in (user_memberships.data or [])]
    if not squad_ids:
        return {"user_id": user_id, "squads": []}

    all_memberships = (
        supabase.table("squad_members")
        .select("squad_id,user_id,role,workouts_this_week")
        .in_("squad_id", squad_ids)
        .execute()
    )

    member_rows = all_memberships.data or []
    name_map = fetch_profile_names([str(m["user_id"]) for m in member_rows])

    members_by_squad: dict[str, list[dict]] = {}
    for member in member_rows:
        squad_id = str(member["squad_id"])
        uid = str(member["user_id"])
        members_by_squad.setdefault(squad_id, []).append(
            {
                "user_id": uid,
                "role": member.get("role"),
                "workouts_this_week": member.get("workouts_this_week", 0),
                "profile_name": name_map.get(uid) or None,
            }
        )

    squads = []
    for row in user_memberships.data or []:
        squad = row.get("squads") or {}
        if squad:
            squad_id = str(squad["id"])
            squads.append(
                {
                    "id": str(squad["id"]),
                    "name": squad.get("name"),
                    "invite_code": squad.get("invite_code"),
                    "weekly_goal": squad.get("weekly_goal", 0),
                    "current_streak": squad.get("current_streak", 0),
                    "members": members_by_squad.get(squad_id, []),
                }
            )

    return {"user_id": user_id, "squads": squads}
