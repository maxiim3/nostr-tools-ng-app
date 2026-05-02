create table if not exists public.francophone_pack_members (
  pubkey text primary key,
  username text not null,
  description text,
  avatar_url text,
  joined_at timestamptz not null,
  follower_count integer,
  following_count integer,
  account_created_at timestamptz,
  post_count integer,
  zap_count integer,
  requested_from_app boolean not null default false,
  requested_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint francophone_pack_members_pubkey_hex check (pubkey ~ '^[0-9a-f]{64}$'),
  constraint francophone_pack_members_follower_count_nonnegative check (
    follower_count is null or follower_count >= 0
  ),
  constraint francophone_pack_members_following_count_nonnegative check (
    following_count is null or following_count >= 0
  ),
  constraint francophone_pack_members_post_count_nonnegative check (
    post_count is null or post_count >= 0
  ),
  constraint francophone_pack_members_zap_count_nonnegative check (
    zap_count is null or zap_count >= 0
  )
);

create index if not exists francophone_pack_members_active_joined_at_idx
  on public.francophone_pack_members (joined_at desc)
  where removed_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_francophone_pack_members_updated_at
  on public.francophone_pack_members;

create trigger set_francophone_pack_members_updated_at
before update on public.francophone_pack_members
for each row
execute function public.set_updated_at();

alter table public.francophone_pack_members enable row level security;

drop policy if exists "service role manages francophone pack members"
  on public.francophone_pack_members;

create policy "service role manages francophone pack members"
on public.francophone_pack_members
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
