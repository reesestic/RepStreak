-- Squads + membership schema for RepStreak social features.
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  weekly_goal integer not null check (weekly_goal > 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.squad_members (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('admin', 'member')),
  workouts_this_week integer not null default 0 check (workouts_this_week >= 0),
  created_at timestamptz not null default now(),
  unique (squad_id, user_id)
);

create index if not exists idx_squads_invite_code on public.squads(invite_code);
create index if not exists idx_squad_members_user_id on public.squad_members(user_id);
create index if not exists idx_squad_members_squad_id on public.squad_members(squad_id);
