# Database Schema

Run the following SQL commands in your Supabase SQL Editor. This script is **safe to run multiple times**; it will only create tables or columns if they are missing.

```sql
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

-- Add last_message_at to channels for unread logic
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'channels' and column_name = 'last_message_at') then
    alter table public.channels add column last_message_at timestamptz default now();
  end if;
end $$;

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

-- 6. APP CONFIG TABLE (For Version Control & Announcements)
create table if not exists public.app_config (
  key text primary key,
  value text not null
);

-- Insert default config values
insert into public.app_config (key, value) values ('min_client_version', '1.0.0') on conflict do nothing;
insert into public.app_config (key, value) values ('announcement_message', 'Welcome to the server! Have fun.') on conflict do nothing;
insert into public.app_config (key, value) values ('announcement_active', 'true') on conflict do nothing;
insert into public.app_config (key, value) values ('announcement_expires_at', '') on conflict do nothing;

-- 7. CHANNEL READS (For Unread Status)
create table if not exists public.channel_reads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete cascade,
  last_read_at timestamptz default now(),
  unique(user_id, channel_id)
);


-- TRIGGER: Update channels.last_message_at on new message
create or replace function public.update_channel_last_message_at()
returns trigger as $$
begin
  update public.channels
  set last_message_at = new.created_at
  where id = new.channel_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute procedure public.update_channel_last_message_at();


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
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'channel_reads') then
    alter publication supabase_realtime add table public.channel_reads;
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
drop policy if exists "Allow all access to app_config" on public.app_config;
create policy "Allow all access to app_config" on public.app_config for all using (true);

alter table public.channel_reads enable row level security;
drop policy if exists "Allow all access to channel_reads" on public.channel_reads;
create policy "Allow all access to channel_reads" on public.channel_reads for all using (true);
```