-- Paloma Supabase Schema
-- Run this in the Supabase SQL editor

-- ==========================================
-- 1. CREATE ALL TABLES FIRST
-- ==========================================

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Trips
create table if not exists trips (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  destination text not null,
  description text,
  start_date date not null,
  end_date date not null,
  invite_code text unique not null,
  cover_image text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Trip members
create table if not exists trip_members (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'member')),
  arrive_date date,
  depart_date date,
  color text default '#3d94d1',
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

-- Itinerary days
create table if not exists itinerary_days (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade,
  date date not null,
  location text not null default '',
  sort_order int default 0
);

-- Itinerary items
create table if not exists itinerary_items (
  id uuid default gen_random_uuid() primary key,
  day_id uuid references itinerary_days(id) on delete cascade,
  title text not null,
  note text,
  time text,
  type text default 'activity',
  done boolean default false,
  created_by uuid references profiles(id),
  sort_order int default 0
);

-- Mood board items
create table if not exists mood_items (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade,
  content text not null,
  type text default 'text',
  caption text,
  source text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Packing items
create table if not exists packing_items (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade,
  category text not null,
  text text not null,
  checked boolean default false,
  checked_by uuid references profiles(id),
  sort_order int default 0
);

-- Cost items
create table if not exists cost_items (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade,
  description text not null,
  amount numeric not null default 0,
  per_person numeric not null default 0,
  pay_to text,
  paid boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Chat messages (AI planner)
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Shared content (social media links)
create table if not exists shared_content (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade,
  source_url text not null,
  source_platform text default 'other',
  thumbnail_url text,
  video_url text,
  ai_analysis jsonb,
  ai_summary text,
  user_notes text,
  status text default 'pending',
  added_to_day_id uuid references itinerary_days(id),
  shared_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Polls
create table if not exists polls (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade,
  question text not null,
  type text default 'single' check (type in ('single', 'multiple', 'ranked')),
  status text default 'open' check (status in ('open', 'closed')),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  closes_at timestamptz
);

-- Poll options
create table if not exists poll_options (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  text text not null,
  image_url text,
  source_url text,
  sort_order int default 0
);

-- Poll votes
create table if not exists poll_votes (
  id uuid default gen_random_uuid() primary key,
  option_id uuid references poll_options(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  rank int,
  created_at timestamptz default now(),
  unique(option_id, user_id)
);

-- Reactions on shared content
create table if not exists reactions (
  id uuid default gen_random_uuid() primary key,
  shared_content_id uuid references shared_content(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type text not null check (type in ('love', 'yes', 'no', 'maybe')),
  created_at timestamptz default now(),
  unique(shared_content_id, user_id)
);

-- ==========================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP
-- ==========================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ==========================================
-- 3. ENABLE RLS ON ALL TABLES
-- ==========================================

alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table itinerary_days enable row level security;
alter table itinerary_items enable row level security;
alter table mood_items enable row level security;
alter table packing_items enable row level security;
alter table cost_items enable row level security;
alter table chat_messages enable row level security;
alter table shared_content enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table reactions enable row level security;

-- ==========================================
-- 4. RLS POLICIES
-- ==========================================

-- Helper: check if user is a member of a trip
-- (trip_members table exists by now)

-- Profiles
create policy "Anyone can view profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Trips
create policy "Anyone can view trips" on trips for select using (true);
create policy "Auth users can create trips" on trips for insert with check (auth.uid() is not null);
create policy "Trip owners can update" on trips for update using (created_by = auth.uid());

-- Trip members
create policy "Members can view trip members" on trip_members for select using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Auth users can join trips" on trip_members for insert with check (auth.uid() = user_id);
create policy "Members can update own membership" on trip_members for update using (user_id = auth.uid());

-- Itinerary days
create policy "Members can view days" on itinerary_days for select using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can manage days" on itinerary_days for insert with check (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can update days" on itinerary_days for update using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can delete days" on itinerary_days for delete using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);

-- Itinerary items
create policy "Members can view items" on itinerary_items for select using (
  day_id in (select id from itinerary_days where trip_id in (select trip_id from trip_members where user_id = auth.uid()))
);
create policy "Members can manage items" on itinerary_items for insert with check (
  day_id in (select id from itinerary_days where trip_id in (select trip_id from trip_members where user_id = auth.uid()))
);
create policy "Members can update items" on itinerary_items for update using (
  day_id in (select id from itinerary_days where trip_id in (select trip_id from trip_members where user_id = auth.uid()))
);
create policy "Members can delete items" on itinerary_items for delete using (
  day_id in (select id from itinerary_days where trip_id in (select trip_id from trip_members where user_id = auth.uid()))
);

-- Mood items
create policy "Members can view mood" on mood_items for select using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can add mood" on mood_items for insert with check (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can update mood" on mood_items for update using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can delete mood" on mood_items for delete using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);

-- Packing items
create policy "Members can view packing" on packing_items for select using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can add packing" on packing_items for insert with check (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can update packing" on packing_items for update using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can delete packing" on packing_items for delete using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);

-- Cost items
create policy "Members can view costs" on cost_items for select using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can add costs" on cost_items for insert with check (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can update costs" on cost_items for update using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can delete costs" on cost_items for delete using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);

-- Chat messages
create policy "Members can view chats" on chat_messages for select using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can add chats" on chat_messages for insert with check (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);

-- Shared content
create policy "Members can view shared" on shared_content for select using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can add shared" on shared_content for insert with check (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can update shared" on shared_content for update using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);

-- Polls
create policy "Members can view polls" on polls for select using (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Members can create polls" on polls for insert with check (
  trip_id in (select trip_id from trip_members where user_id = auth.uid())
);
create policy "Poll creators can update" on polls for update using (created_by = auth.uid());

-- Poll options
create policy "Members can view options" on poll_options for select using (
  poll_id in (select id from polls where trip_id in (select trip_id from trip_members where user_id = auth.uid()))
);
create policy "Members can add options" on poll_options for insert with check (
  poll_id in (select id from polls where trip_id in (select trip_id from trip_members where user_id = auth.uid()))
);

-- Poll votes
create policy "Members can view votes" on poll_votes for select using (
  option_id in (select id from poll_options where poll_id in (select id from polls where trip_id in (select trip_id from trip_members where user_id = auth.uid())))
);
create policy "Members can vote" on poll_votes for insert with check (auth.uid() = user_id);
create policy "Members can change vote" on poll_votes for update using (user_id = auth.uid());
create policy "Members can remove vote" on poll_votes for delete using (user_id = auth.uid());

-- Reactions
create policy "Members can view reactions" on reactions for select using (
  shared_content_id in (select id from shared_content where trip_id in (select trip_id from trip_members where user_id = auth.uid()))
);
create policy "Members can react" on reactions for insert with check (auth.uid() = user_id);
create policy "Members can change reaction" on reactions for update using (user_id = auth.uid());
create policy "Members can remove reaction" on reactions for delete using (user_id = auth.uid());

-- ==========================================
-- 5. ENABLE REALTIME
-- ==========================================

alter publication supabase_realtime add table trip_members;
alter publication supabase_realtime add table itinerary_items;
alter publication supabase_realtime add table mood_items;
alter publication supabase_realtime add table packing_items;
alter publication supabase_realtime add table cost_items;
alter publication supabase_realtime add table shared_content;
alter publication supabase_realtime add table polls;
alter publication supabase_realtime add table poll_votes;
alter publication supabase_realtime add table reactions;
