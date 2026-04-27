-- Generation log table for rate limiting (5 generations/day per user)
create table if not exists public.generation_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now() not null
);

alter table public.generation_log enable row level security;

create policy "Users can view their own generation log"
  on public.generation_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generation log"
  on public.generation_log for insert
  with check (auth.uid() = user_id);

-- Index for efficient daily count queries
create index if not exists idx_generation_log_user_date
  on public.generation_log (user_id, created_at);
