create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  experience text not null check (experience in (
    'Teljesen kezdő',
    'Gyakorlósípon tanulok',
    'Már dudán játszom',
    'Ajándékba vagy másnak érdeklődöm'
  )),
  message text check (message is null or char_length(message) <= 2000),
  source_page text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;

drop policy if exists "Anyone can join waitlist" on public.waitlist_signups;
create policy "Anyone can join waitlist"
  on public.waitlist_signups
  for insert
  to anon, authenticated
  with check (true);

-- Keep read/update/delete access closed in the public API.
-- View/export entries from the Supabase dashboard or a server-side admin tool.
