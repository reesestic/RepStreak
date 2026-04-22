import os
import random
import string
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from supabase import Client, create_client


ChallengeType = Literal["visits", "volume", "reps"]

# Load .env from the project root (parent of backend/) regardless of CWD.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_PROJECT_ROOT / ".env")


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
    created_by: str | None = None
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
        .select("squad_id,squads(id,name,invite_code,weekly_goal,current_streak,created_by)")
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
                    "created_by": str(squad["created_by"]) if squad.get("created_by") else None,
                    "members": members_by_squad.get(squad_id, []),
                }
            )

    return {"user_id": user_id, "squads": squads}


# --------------------------------------------------------------------------
# Use Case 4: Squad Challenges
# --------------------------------------------------------------------------


class CreateChallengeRequest(BaseModel):
    user_id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=100)
    target_goal: int = Field(ge=1)
    challenge_type: ChallengeType = "visits"
    duration_days: int = Field(default=7, ge=1, le=365)


class ParticipationRequest(BaseModel):
    user_id: str = Field(min_length=1)
    opt_in: bool


class ChallengeParticipantResponse(BaseModel):
    user_id: str
    progress: int


class ChallengeResponse(BaseModel):
    id: str
    squad_id: str
    name: str
    target_goal: int
    challenge_type: ChallengeType
    duration_days: int
    is_active: bool
    created_by: str
    created_at: str | None = None
    ends_at: str | None = None
    participants: list[ChallengeParticipantResponse]


class ChallengeListResponse(BaseModel):
    squad_id: str
    challenges: list[ChallengeResponse]


class ParticipationResponse(BaseModel):
    challenge_id: str
    user_id: str
    opted_in: bool


def _require_squad_admin(squad_id: str, user_id: str) -> None:
    """Ensures the caller is the squad's created_by (admin)."""
    squad_result = (
        supabase.table("squads")
        .select("id,created_by")
        .eq("id", squad_id)
        .limit(1)
        .execute()
    )
    if not squad_result.data:
        raise HTTPException(status_code=404, detail="Squad not found.")
    squad = squad_result.data[0]
    if str(squad.get("created_by")) != str(user_id):
        raise HTTPException(status_code=403, detail="Only the squad admin can perform this action.")


def _fetch_participants_by_challenge(challenge_ids: list[str]) -> dict[str, list[dict]]:
    if not challenge_ids:
        return {}
    res = (
        supabase.table("challenge_participants")
        .select("challenge_id,user_id,progress")
        .in_("challenge_id", challenge_ids)
        .execute()
    )
    out: dict[str, list[dict]] = {}
    for row in res.data or []:
        cid = str(row["challenge_id"])
        out.setdefault(cid, []).append(
            {
                "user_id": str(row["user_id"]),
                "progress": int(row.get("progress") or 0),
            }
        )
    return out


@app.post("/squads/{squad_id}/challenges", response_model=ChallengeResponse)
def create_challenge(squad_id: str, payload: CreateChallengeRequest):
    _require_squad_admin(squad_id, payload.user_id)

    insert = (
        supabase.table("squad_challenges")
        .insert(
            {
                "squad_id": squad_id,
                "name": payload.name.strip(),
                "target_goal": payload.target_goal,
                "challenge_type": payload.challenge_type,
                "duration_days": payload.duration_days,
                "is_active": True,
                "created_by": payload.user_id,
            }
        )
        .execute()
    )
    if not insert.data:
        raise HTTPException(status_code=500, detail="Could not create challenge.")

    row = insert.data[0]
    return {
        "id": str(row["id"]),
        "squad_id": str(row["squad_id"]),
        "name": row["name"],
        "target_goal": int(row["target_goal"]),
        "challenge_type": row.get("challenge_type") or "visits",
        "duration_days": int(row.get("duration_days") or 7),
        "is_active": bool(row.get("is_active", True)),
        "created_by": str(row["created_by"]),
        "created_at": row.get("created_at"),
        "ends_at": row.get("ends_at"),
        "participants": [],
    }


@app.get("/squads/{squad_id}/challenges", response_model=ChallengeListResponse)
def list_squad_challenges(squad_id: str, active_only: bool = True):
    query = (
        supabase.table("squad_challenges")
        .select(
            "id,squad_id,name,target_goal,challenge_type,duration_days,is_active,created_by,created_at,ends_at"
        )
        .eq("squad_id", squad_id)
        .order("created_at", desc=True)
    )
    if active_only:
        query = query.eq("is_active", True)
    res = query.execute()

    rows = res.data or []
    participants_map = _fetch_participants_by_challenge([str(r["id"]) for r in rows])

    challenges = []
    for row in rows:
        cid = str(row["id"])
        challenges.append(
            {
                "id": cid,
                "squad_id": str(row["squad_id"]),
                "name": row["name"],
                "target_goal": int(row["target_goal"]),
                "challenge_type": row.get("challenge_type") or "visits",
                "duration_days": int(row.get("duration_days") or 7),
                "is_active": bool(row.get("is_active", True)),
                "created_by": str(row["created_by"]),
                "created_at": row.get("created_at"),
                "ends_at": row.get("ends_at"),
                "participants": participants_map.get(cid, []),
            }
        )
    return {"squad_id": squad_id, "challenges": challenges}


@app.post("/challenges/{challenge_id}/participation", response_model=ParticipationResponse)
def set_participation(challenge_id: str, payload: ParticipationRequest):
    challenge_result = (
        supabase.table("squad_challenges")
        .select("id")
        .eq("id", challenge_id)
        .limit(1)
        .execute()
    )
    if not challenge_result.data:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    if payload.opt_in:
        existing = (
            supabase.table("challenge_participants")
            .select("id")
            .eq("challenge_id", challenge_id)
            .eq("user_id", payload.user_id)
            .limit(1)
            .execute()
        )
        if not existing.data:
            insert = (
                supabase.table("challenge_participants")
                .insert(
                    {
                        "challenge_id": challenge_id,
                        "user_id": payload.user_id,
                        "progress": 0,
                    }
                )
                .execute()
            )
            if not insert.data:
                raise HTTPException(status_code=500, detail="Could not opt in to challenge.")
        return {"challenge_id": challenge_id, "user_id": payload.user_id, "opted_in": True}

    (
        supabase.table("challenge_participants")
        .delete()
        .eq("challenge_id", challenge_id)
        .eq("user_id", payload.user_id)
        .execute()
    )
    return {"challenge_id": challenge_id, "user_id": payload.user_id, "opted_in": False}
