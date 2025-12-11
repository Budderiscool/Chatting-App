-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Safely add columns if they don't exist (Migration)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'password') then
    alter table public.users add column password text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'last_username_change') then
    alter table public.users add column last_username_change timestamptz;
  end if;
end $$;

-- 2. SERVERS TABLE
create table if not exists public.servers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- 3. CHANNELS TABLE
create table if not exists public.channels (
  id uuid default gen_random_uuid() primary key,
  server_id uuid references public.servers(id) on delete cascade,
  name text not null,
  is_dm boolean default false,
  created_at timestamptz default now()
);

-- 4. SERVER MEMBERS TABLE
create table if not exists public.server_members (
  id uuid default gen_random_uuid() primary key,
  server_id uuid references public.servers(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(server_id, user_id)
);

-- 5. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.channels(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  content text,
  media_url text,
  media_type text,
  created_at timestamptz default now()
);

-- Migration for messages table columns
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'reply_to_message_id') then
    alter table public.messages add column reply_to_message_id uuid references public.messages(id) on delete set null;
  end if;
  
   if not exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'reactions') then
    alter table public.messages add column reactions jsonb default '{}'::jsonb;
  end if;
end $$;

-- 6. APP CONFIG TABLE (For Version Control)
create table if not exists public.app_config (
  key text primary key,
  value text not null
);

-- Insert default version if not exists. 
-- UPDATE THIS VALUE IN THE DATABASE WHEN YOU DEPLOY A NEW VERSION to trigger the reload prompt for users.
insert into public.app_config (key, value) values ('min_client_version', '1.0.0') on conflict do nothing;


-- ENABLE REALTIME
-- We use a block to prevent errors if publication exists
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'servers') then
    alter publication supabase_realtime add table public.servers;
  end if;
   if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'channels') then
    alter publication supabase_realtime add table public.channels;
  end if;
   if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'server_members') then
    alter publication supabase_realtime add table public.server_members;
  end if;
   if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'users') then
    alter publication supabase_realtime add table public.users;
  end if;
   if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'app_config') then
    alter publication supabase_realtime add table public.app_config;
  end if;
end $$;

-- ROW LEVEL SECURITY (RLS)
-- Drop existing policies to ensure clean state
alter table public.users enable row level security;
drop policy if exists "Allow all access to users" on public.users;
create policy "Allow all access to users" on public.users for all using (true);

alter table public.servers enable row level security;
drop policy if exists "Allow all access to servers" on public.servers;
create policy "Allow all access to servers" on public.servers for all using (true);

alter table public.channels enable row level security;
drop policy if exists "Allow all access to channels" on public.channels;
create policy "Allow all access to channels" on public.channels for all using (true);

alter table public.server_members enable row level security;
drop policy if exists "Allow all access to server_members" on public.server_members;
create policy "Allow all access to server_members" on public.server_members for all using (true);

alter table public.messages enable row level security;
drop policy if exists "Allow all access to messages" on public.messages;
create policy "Allow all access to messages" on public.messages for all using (true);

alter table public.app_config enable row level security;
drop policy if exists "Allow read access to app_config" on public.app_config;
create policy "Allow read access to app_config" on public.app_config for select using (true);
