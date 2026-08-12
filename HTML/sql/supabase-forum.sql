create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 3 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.forum_posts enable row level security;

create policy "Anyone can read forum posts"
  on public.forum_posts
  for select
  using (true);

create policy "Authenticated users can create forum posts"
  on public.forum_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own forum posts"
  on public.forum_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own forum posts"
  on public.forum_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);
