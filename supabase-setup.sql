-- Plants table
create table if not exists plants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  variety text,
  type text check (type in ('seed', 'starter')) not null,
  category text check (category in ('vegetable', 'herb', 'flower', 'other')) default 'vegetable',
  location text,
  planted_date date,
  germination_date date,
  expected_germination_days integer,
  first_harvest_date date,
  expected_days_to_maturity integer,
  notes text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Care logs (watering, fertilizing, etc.)
create table if not exists care_logs (
  id uuid default gen_random_uuid() primary key,
  plant_id uuid references plants(id) on delete cascade,
  log_date date not null default current_date,
  care_type text check (care_type in ('watering', 'fertilizing', 'pruning', 'pest_treatment', 'other')) not null,
  notes text,
  created_at timestamptz default now()
);

-- Garden photos
create table if not exists garden_photos (
  id uuid default gen_random_uuid() primary key,
  plant_id uuid references plants(id) on delete set null,
  photo_url text not null,
  taken_date date default current_date,
  notes text,
  ai_diagnosis text,
  created_at timestamptz default now()
);

-- Observations (leaf color, pests, soil pH, etc.)
create table if not exists observations (
  id uuid default gen_random_uuid() primary key,
  plant_id uuid references plants(id) on delete cascade,
  observed_date date default current_date,
  observation_type text check (observation_type in ('leaf_color', 'pest', 'soil_ph', 'disease', 'other')) not null,
  description text not null,
  ai_suggestion text,
  created_at timestamptz default now()
);

-- Enable storage for photos
insert into storage.buckets (id, name, public)
values ('garden-photos', 'garden-photos', true)
on conflict (id) do nothing;

-- Storage policy: allow all operations (simple setup)
create policy "Public Access" on storage.objects for all using (bucket_id = 'garden-photos') with check (bucket_id = 'garden-photos');
