create table if not exists public.careeros_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.careeros_profiles enable row level security;

create policy "Users can read their CareerOS profile"
  on public.careeros_profiles
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their CareerOS profile"
  on public.careeros_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their CareerOS profile"
  on public.careeros_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
