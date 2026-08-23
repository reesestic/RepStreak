# RepStreak

> Build the habit. Keep the streak. Train with your squad.

RepStreak is a cross-platform fitness app that turns your workouts into a
streak you can see, share, and compete on. Log a session, watch your streak
climb, and chase weekly challenges with friends — all from your phone.

## Highlights

- **Smart workouts** — generate a session from the muscles you want to
  hit and the time you have.
- **Daily streaks** — your home screen shows your real streak and
  instantly flips to "Workout logged for today" once you finish.
- **Squads** — create or join a squad with an invite code and watch your
  team crush a shared weekly visits goal.
- **Challenges** — any admin can spin up a weekly challenge tracking
  *visits*, *volume (lbs)*, or *reps*, complete with an opt-in leaderboard.
- **History & PRs** — browse every exercise you've done and see your
  all-time best weight per lift.
- **Runs everywhere** — iOS, Android, and web out of the box (Expo).

## Overview

RepStreak is split into two pieces that talk to a managed Postgres:

```
Expo / React Native app  ──►  FastAPI backend  ──►  Supabase (Postgres + Auth)
```

- The **mobile app** handles auth, workout logging, history, and the UI for
  squads and challenges. It talks to Supabase directly for most reads/writes
  and calls our FastAPI service for the social features.
- The **FastAPI backend** owns squad membership, invite codes, challenge
  creation, opt-ins, and the "workout completed" hook that fans a finished
  session out to every active squad and challenge the user is in.
- **Supabase** stores everything — users, profiles, exercises, sessions,
  squads, challenges, and participation.

## Team and contributions

RepStreak was developed by a four-person CS 411 team at Boston University.
The team collaborated across planning, development, testing, and user research.

- **Reese Stichter** — Workout Database Architect, Workout Generator Creator, History Page Creator, Scrum Lead, User Authentication
- **James Conlon** — Backend Architect, Squad Features Designer, Challenges Creator
- **Andrew Andea** — Black-box Testing, Documentation
- **William Spannuth** — Black-box Testing, Documentation, File Cleanup, README Writer

## Usage

Once you're signed in, the app walks itself:

1. **Home** — shows your streak, weekly workout count, and today's workout.
   If you've already logged a session today, the card flips green with
   "Workout logged for today".
2. **Generate** — pick muscles + available time, and the app builds a
   routine for you. Swap exercises, then tap **Start Workout**.
3. **Workout** — log sets and reps live. When you save, your squad's
   weekly visits and every challenge you're opted into update automatically.
4. **Social** — create a squad, share the invite code, and spin up a weekly
   challenge (visits / volume / reps). Opt in to join the leaderboard.
5. **Profile** — edit your display username and personal data.

## Installation

RepStreak has three parts to run locally: a Supabase project, the FastAPI
backend, and the Expo app.

### 1. Requirements

- Node.js 20+ and npm
- Python 3.11+
- A free [Supabase](https://supabase.com) project
- Expo Go on your phone, or an iOS/Android simulator

### 2. Environment variables

Copy `.env.example` → `.env` at the repo root and fill in:

```bash
# Supabase (used by both the app and the backend)
EXPO_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="<anon key>"
SUPABASE_URL="https://<project>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service role key>"

# Where the app should find the FastAPI backend
EXPO_PUBLIC_API_BASE_URL="http://localhost:8000"
```

### 3. Database schema

In the Supabase SQL editor, run:

```
backend/squads_schema.sql
backend/challenges_schema.sql
```

### 4. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install fastapi "uvicorn[standard]" supabase python-dotenv

python3 -m uvicorn squads_api:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Mobile app

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, press `i` for iOS simulator, `a` for
Android, or `w` for web.

## Project layout

```
RepStreak/
├── app/                    Expo Router screens and routes
├── backend/                FastAPI backend
├── components/             Reusable React Native UI components
│   ├── history/            Components for workout history and progress views
│   └── workout/            Components for workout generation, logging, and sessions
├── context/                React context providers
├── lib/                    Shared frontend logic and app utilities
│   ├── models/             Domain classes
│   ├── services/           Data access and API/service logic
│   ├── utils/              Util type files
│   └── supabase.ts         Supabase config
├── scripts/                Project scripts
└── types/                  TypeScript type files
```

## Exercise dataset

RepStreak’s workout generator uses a curated exercise dataset organized by
muscle group, movement category, equipment, difficulty, and compound status.

[View the complete exercise dataset](data/exercises.csv).

## Technical highlights

- **Workout generation** — filters the curated
  [exercise dataset](data/exercises.csv) by selected muscles, equipment,
  difficulty, and movement pattern to build workouts that fit the user's
  available time.

- **Streak calculation** — 
  [`DashboardService.ts`](lib/services/DashboardService.ts) groups completed
  sessions by local date and walks backward from today or yesterday to calculate
  consecutive workout days.

- **Squad and challenge updates** — completing a workout triggers the
  `/workouts/complete` endpoint, which updates every active squad and opted-in
  challenge using the appropriate metric: visits, training volume, or reps.

## Authors

Built by the RepStreak team for CS 411 @ BU, Spring 2026.

- Andrew Andea — [andy34@bu.edu](mailto:andy34@bu.edu)
- James Conlon — [conlon@bu.edu](mailto:conlon@bu.edu)
- William Spannuth — [wcs89@bu.edu](mailto:wcs89@bu.edu)
- Reese Stichter — [rsticht@bu.edu](mailto:rsticht@bu.edu)
