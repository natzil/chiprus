create extension if not exists "pgcrypto";

create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  branch text not null default 'learning' check (branch in ('learning','hobby')),
  area text not null default 'learning',
  type text not null default 'custom' check (type in ('lesson','review','project_task','english_activity','custom')),
  xp integer not null default 0 check (xp >= 0),
  minutes integer not null default 0 check (minutes >= 0),
  status text not null default 'active' check (status in ('active','done','archived')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists course_lessons (
  id uuid primary key default gen_random_uuid(),
  course text not null,
  day_number integer not null check (day_number > 0),
  title text not null,
  description text default '',
  xp integer not null default 40 check (xp >= 0),
  status text not null default 'not_started' check (status in ('not_started','done','skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(course, day_number)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text default '',
  area text not null default 'hobby',
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  importance text default 'средняя',
  difficulty text default 'средняя',
  target_xp integer not null default 100 check (target_xp > 0),
  current_stage text default '',
  created_at timestamptz not null default now()
);

create table if not exists project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text default '',
  xp integer not null default 0 check (xp >= 0),
  status text not null default 'active' check (status in ('active','done','archived')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists english_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  minutes integer not null check (minutes > 0),
  xp integer not null default 0 check (xp >= 0),
  skills text[] not null default '{}',
  note text default '',
  activity_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  amount integer not null check (amount >= 0),
  area text not null default 'general',
  source_type text not null default 'manual' check (source_type in ('quest','course_lesson','project_task','english_activity','manual')),
  source_id uuid,
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_quests_status on quests(status);
create index if not exists idx_quests_area on quests(area);
create index if not exists idx_course_lessons_course_day on course_lessons(course, day_number);
create index if not exists idx_project_tasks_project_id on project_tasks(project_id);
create index if not exists idx_xp_events_created_at on xp_events(created_at);
create index if not exists idx_xp_events_area on xp_events(area);
create index if not exists idx_english_activities_activity_date on english_activities(activity_date);

alter table quests enable row level security;
alter table course_lessons enable row level security;
alter table projects enable row level security;
alter table project_tasks enable row level security;
alter table english_activities enable row level security;
alter table xp_events enable row level security;
alter table settings enable row level security;

drop policy if exists "public select quests" on quests;
drop policy if exists "public select course_lessons" on course_lessons;
drop policy if exists "public select projects" on projects;
drop policy if exists "public select project_tasks" on project_tasks;
drop policy if exists "public select english_activities" on english_activities;
drop policy if exists "public select xp_events" on xp_events;
drop policy if exists "public select settings" on settings;

create policy "public select quests" on quests for select using (true);
create policy "public select course_lessons" on course_lessons for select using (true);
create policy "public select projects" on projects for select using (true);
create policy "public select project_tasks" on project_tasks for select using (true);
create policy "public select english_activities" on english_activities for select using (true);
create policy "public select xp_events" on xp_events for select using (true);
create policy "public select settings" on settings for select using (true);

drop policy if exists "authenticated insert quests" on quests;
drop policy if exists "authenticated update quests" on quests;
drop policy if exists "authenticated delete quests" on quests;
drop policy if exists "authenticated insert course_lessons" on course_lessons;
drop policy if exists "authenticated update course_lessons" on course_lessons;
drop policy if exists "authenticated delete course_lessons" on course_lessons;
drop policy if exists "authenticated insert projects" on projects;
drop policy if exists "authenticated update projects" on projects;
drop policy if exists "authenticated delete projects" on projects;
drop policy if exists "authenticated insert project_tasks" on project_tasks;
drop policy if exists "authenticated update project_tasks" on project_tasks;
drop policy if exists "authenticated delete project_tasks" on project_tasks;
drop policy if exists "authenticated insert english_activities" on english_activities;
drop policy if exists "authenticated update english_activities" on english_activities;
drop policy if exists "authenticated delete english_activities" on english_activities;
drop policy if exists "authenticated insert xp_events" on xp_events;
drop policy if exists "authenticated update xp_events" on xp_events;
drop policy if exists "authenticated delete xp_events" on xp_events;
drop policy if exists "authenticated insert settings" on settings;
drop policy if exists "authenticated update settings" on settings;
drop policy if exists "authenticated delete settings" on settings;

create policy "authenticated insert quests" on quests for insert to authenticated with check (true);
create policy "authenticated update quests" on quests for update to authenticated using (true) with check (true);
create policy "authenticated delete quests" on quests for delete to authenticated using (true);
create policy "authenticated insert course_lessons" on course_lessons for insert to authenticated with check (true);
create policy "authenticated update course_lessons" on course_lessons for update to authenticated using (true) with check (true);
create policy "authenticated delete course_lessons" on course_lessons for delete to authenticated using (true);
create policy "authenticated insert projects" on projects for insert to authenticated with check (true);
create policy "authenticated update projects" on projects for update to authenticated using (true) with check (true);
create policy "authenticated delete projects" on projects for delete to authenticated using (true);
create policy "authenticated insert project_tasks" on project_tasks for insert to authenticated with check (true);
create policy "authenticated update project_tasks" on project_tasks for update to authenticated using (true) with check (true);
create policy "authenticated delete project_tasks" on project_tasks for delete to authenticated using (true);
create policy "authenticated insert english_activities" on english_activities for insert to authenticated with check (true);
create policy "authenticated update english_activities" on english_activities for update to authenticated using (true) with check (true);
create policy "authenticated delete english_activities" on english_activities for delete to authenticated using (true);
create policy "authenticated insert xp_events" on xp_events for insert to authenticated with check (true);
create policy "authenticated update xp_events" on xp_events for update to authenticated using (true) with check (true);
create policy "authenticated delete xp_events" on xp_events for delete to authenticated using (true);
create policy "authenticated insert settings" on settings for insert to authenticated with check (true);
create policy "authenticated update settings" on settings for update to authenticated using (true) with check (true);
create policy "authenticated delete settings" on settings for delete to authenticated using (true);

insert into settings(key, value) values
  ('english_target_hours', '300'::jsonb),
  ('character_name', '"Оператор"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into projects(name, description, area, status, importance, difficulty, target_xp, current_stage)
select 'NAS / домашний сервер', 'Домашнее хранилище, сервисы и резервные копии', 'hobby', 'active', 'высокая', 'средняя', 500, 'выбрать ОС для сервера'
where not exists (select 1 from projects where name = 'NAS / домашний сервер');

update projects
set description = 'Домашнее хранилище, сервисы и резервные копии',
    area = 'hobby',
    status = 'active',
    importance = 'высокая',
    difficulty = 'средняя',
    target_xp = 500,
    current_stage = 'выбрать ОС для сервера'
where name = 'NAS / домашний сервер';

insert into projects(name, description, area, status, importance, difficulty, target_xp, current_stage)
select 'ESP32 + RFID замок', 'Pet-проект контроля доступа на ESP32', 'hobby', 'active', 'средняя', 'средняя', 400, 'прошивка чтения карт'
where not exists (select 1 from projects where name = 'ESP32 + RFID замок');

update projects
set description = 'Pet-проект контроля доступа на ESP32',
    area = 'hobby',
    status = 'active',
    importance = 'средняя',
    difficulty = 'средняя',
    target_xp = 400,
    current_stage = 'прошивка чтения карт'
where name = 'ESP32 + RFID замок';

insert into quests(title, description, branch, area, type, xp, minutes, status, due_date)
select 'CCNA · Day 1 — Introduction', 'Jeremy''s IT Lab CCNA Free Course — Day 1', 'learning', 'CCNA', 'lesson', 40, 45, 'active', current_date
where not exists (select 1 from quests where title = 'CCNA · Day 1 — Introduction');

insert into quests(title, description, branch, area, type, xp, minutes, status, due_date)
select 'English · 15 мин listening/speaking', 'Короткая чистая практика B2', 'learning', 'English', 'english_activity', 15, 15, 'active', current_date
where not exists (select 1 from quests where title = 'English · 15 мин listening/speaking');

insert into quests(title, description, branch, area, type, xp, minutes, status, due_date)
select 'NAS — выбрать ОС для сервера', 'Следующий шаг проекта NAS', 'hobby', 'NAS', 'project_task', 60, 60, 'active', current_date
where not exists (select 1 from quests where title = 'NAS — выбрать ОС для сервера');

insert into course_lessons(course, day_number, title, description, xp, status)
select 'ccna', n, 'CCNA Day ' || n, 'Jeremy''s IT Lab CCNA Free Course — Day ' || n, 40, 'not_started'
from generate_series(1, 63) as n
where not exists (
  select 1
  from course_lessons c
  where c.course = 'ccna'
  and c.day_number = n
);

insert into project_tasks(project_id, title, description, xp, status)
select p.id, 'Выбрать ОС для сервера', 'TrueNAS / Debian / Unraid', 60, 'active'
from projects p
where p.name = 'NAS / домашний сервер'
and not exists (select 1 from project_tasks t where t.project_id = p.id and t.title = 'Выбрать ОС для сервера');

insert into project_tasks(project_id, title, description, xp, status)
select p.id, 'Проверить чтение UID карты', 'ESP32 + RFID reader smoke test', 45, 'active'
from projects p
where p.name = 'ESP32 + RFID замок'
and not exists (select 1 from project_tasks t where t.project_id = p.id and t.title = 'Проверить чтение UID карты');
