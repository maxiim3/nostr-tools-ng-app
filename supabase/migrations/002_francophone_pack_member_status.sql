alter table public.francophone_pack_members
  add column if not exists status text;

update public.francophone_pack_members
set status = 'success'
where status is null;

alter table public.francophone_pack_members
  alter column status set default 'success',
  alter column status set not null;

alter table public.francophone_pack_members
  drop constraint if exists francophone_pack_members_status_valid;

alter table public.francophone_pack_members
  add constraint francophone_pack_members_status_valid
  check (status in ('pending', 'success', 'rejected'));

create index if not exists francophone_pack_members_status_requested_at_idx
  on public.francophone_pack_members (status, requested_at desc)
  where removed_at is null;
