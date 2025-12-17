-- Create watch_sessions table for real-time watch together functionality
-- No RLS needed since sessions are anonymous and temporary

create table if not exists public.watch_sessions (
  id text primary key,
  code text unique not null,
  video_type text not null,
  video_identifier text not null,
  stream_url text not null,
  title text not null,
  current_time real default 0,
  is_playing boolean default false,
  host_id text not null,
  participants jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster lookups by code
create index if not exists idx_watch_sessions_code on public.watch_sessions(code);

-- Create index for faster lookups by creation time (for cleanup)
create index if not exists idx_watch_sessions_created_at on public.watch_sessions(created_at);

-- Enable realtime for this table
alter publication supabase_realtime add table public.watch_sessions;

-- No RLS policies needed - sessions are anonymous and public
-- Anyone with the code can join
alter table public.watch_sessions disable row level security;

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger to update updated_at on every update
drop trigger if exists watch_sessions_updated_at on public.watch_sessions;
create trigger watch_sessions_updated_at
  before update on public.watch_sessions
  for each row
  execute function public.handle_updated_at();
