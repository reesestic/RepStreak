-- Squad challenges schema 

create extension if not exists pgcrypto;

create table if not exists public.squad_challenges (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  name text not null check (char_length(name) > 0),
  target_goal integer not null check (target_goal > 0),
  challenge_type text not null default 'visits'
    check (challenge_type in ('visits', 'volume', 'reps')),
  duration_days integer not null default 7 check (duration_days > 0),
  is_active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days')
);

-- Safe upgrade path: add challenge_type if an older version of the table already exists.
alter table public.squad_challenges
  add column if not exists challenge_type text not null default 'visits';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'squad_challenges_challenge_type_check'
  ) then
    alter table public.squad_challenges
      add constraint squad_challenges_challenge_type_check
      check (challenge_type in ('visits', 'volume', 'reps'));
  end if;
end$$;

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.squad_challenges(id) on delete cascade,
  user_id uuid not null,
  progress integer not null default 0 check (progress >= 0),
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create index if not exists idx_squad_challenges_squad_id on public.squad_challenges(squad_id);
create index if not exists idx_squad_challenges_active on public.squad_challenges(squad_id, is_active);
create index if not exists idx_challenge_participants_challenge on public.challenge_participants(challenge_id);
create index if not exists idx_challenge_participants_user on public.challenge_participants(user_id);
