create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Anyone can read profiles" on public.profiles;
create policy "Anyone can read profiles"
  on public.profiles
  for select
  using (true);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 3 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.forum_posts enable row level security;

drop policy if exists "Anyone can read forum posts" on public.forum_posts;
create policy "Anyone can read forum posts"
  on public.forum_posts
  for select
  using (true);

drop policy if exists "Authenticated users can create forum posts" on public.forum_posts;
create policy "Authenticated users can create forum posts"
  on public.forum_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own forum posts" on public.forum_posts;
create policy "Users can update their own forum posts"
  on public.forum_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own forum posts" on public.forum_posts;
create policy "Users can delete their own forum posts"
  on public.forum_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'forum_comments_post_id_fkey'
      and conrelid = 'public.forum_comments'::regclass
  ) then
    alter table public.forum_comments
      add constraint forum_comments_post_id_fkey
      foreign key (post_id)
      references public.forum_posts(id)
      on delete cascade;
  end if;
end $$;

alter table public.forum_comments enable row level security;

drop policy if exists "Anyone can read forum comments" on public.forum_comments;
create policy "Anyone can read forum comments"
  on public.forum_comments
  for select
  using (true);

drop policy if exists "Authenticated users can create forum comments" on public.forum_comments;
create policy "Authenticated users can create forum comments"
  on public.forum_comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own forum comments" on public.forum_comments;
create policy "Users can update their own forum comments"
  on public.forum_comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own forum comments" on public.forum_comments;
create policy "Users can delete their own forum comments"
  on public.forum_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- After your own user exists, run this with your auth.users id to show Admin in the forum:
-- insert into public.profiles (id, display_name, is_admin)
-- values ('YOUR_USER_ID_HERE', 'Admin', true)
-- on conflict (id) do update set display_name = 'Admin', is_admin = true;
