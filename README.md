# Blue's Clueless 🐾

> *"We have no idea either."*

A tiny, ephemeral group chat for a small crew. One shared room. Messages live only while you're connected — no chat history, no storage. Profiles persist so your friends recognize you when you come back.

## Stack

- **Next.js 14** (App Router, TypeScript) — deploys clean to Vercel
- **Supabase** — email/password auth + realtime broadcast channel + a tiny `profiles` table
- **Tailwind CSS** — custom Blue's Clues–y theme (navy, cyan, cream, paws)
- **emoji-picker-react**, **@giphy/react-components** — emojis & GIFs

## How "ephemeral" works

Messages are sent over a Supabase Realtime **broadcast** channel — they hit other connected clients and are kept in each client's memory only. Nothing is written to the database. Refresh = empty chat. New joiners only see messages sent after they joined. Images are resized client-side and broadcast as base64 (no storage bucket touched).

The only persisted data is the `profiles` row (id + username) so we can show your name when you log back in.

---

## Setup

### 1. Install deps

```bash
cd blues-clueless
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com> → New Project.
2. In **Project Settings → API**, copy the **Project URL** and **anon public key**.
3. In **Authentication → Providers → Email**, you can disable "Confirm email" for instant signup during dev (optional).

### 3. Run this SQL in the Supabase SQL Editor

```sql
-- Profile table: just the things we need to display you in chat.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (char_length(username) between 2 and 20),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Anyone signed in can read profiles (so we can display usernames).
create policy "profiles are readable by authenticated"
  on public.profiles for select
  to authenticated using (true);

-- A user can insert/update their own profile row.
create policy "users manage their own profile"
  on public.profiles for insert
  to authenticated with check (auth.uid() = id);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

-- Auto-create profile on signup using the username from auth metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 4. Get a free Giphy API key

<https://developers.giphy.com/dashboard/> → Create App → "API". Copy the key.

### 5. Configure env vars

Copy `.env.local.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_GIPHY_API_KEY=xxxxxxxxxxxx
```

### 6. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>, sign up two accounts (different browsers / incognito works), and you're chatting.

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo at <https://vercel.com/new>.
3. Add the three `NEXT_PUBLIC_*` env vars in the Vercel project settings.
4. Deploy. Done.

---

## Notes & limitations

- **Image size**: Images are resized to ≤800px and JPEG-compressed below ~180KB before broadcast. Supabase broadcast has a ~256KB payload cap.
- **Reliability**: Broadcast is best-effort. If you want guaranteed delivery, you'd need persistence (which defeats the ephemeral goal).
- **Single room**: Everyone joins `blues-clueless-room`. Change the `ROOM` constant in `lib/supabase.ts` to fork off private rooms.
- **No moderation**. Small trusted groups only.
