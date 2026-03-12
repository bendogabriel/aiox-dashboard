-- ============================================================
-- Brainstorm Rooms — persistent storage for brainstorm sessions
-- ============================================================

create table if not exists brainstorm_rooms (
  id          text primary key,
  name        text not null,
  description text,
  phase       text not null default 'collecting',
  ideas       jsonb not null default '[]'::jsonb,
  groups      jsonb not null default '[]'::jsonb,
  outputs     jsonb not null default '[]'::jsonb,
  tags        jsonb not null default '[]'::jsonb,
  created_at  text not null default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  updated_at  text not null default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);

-- Index for listing rooms sorted by creation date
create index if not exists idx_brainstorm_rooms_created
  on brainstorm_rooms (created_at desc);

-- RLS: allow anon full CRUD (matches orchestration_tasks policy)
alter table brainstorm_rooms enable row level security;

create policy "anon_brainstorm_select" on brainstorm_rooms
  for select to anon using (true);

create policy "anon_brainstorm_insert" on brainstorm_rooms
  for insert to anon with check (true);

create policy "anon_brainstorm_update" on brainstorm_rooms
  for update to anon using (true) with check (true);

create policy "anon_brainstorm_delete" on brainstorm_rooms
  for delete to anon using (true);
