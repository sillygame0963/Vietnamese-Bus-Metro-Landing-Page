-- Profiles (extends Supabase Auth users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_emoji text not null default '👤',
  total_points integer not null default 0,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'diamond')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Profiles readable by all" on profiles for select using (true);
create policy "Allow insert for new profiles" on profiles for insert with check (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Người dùng'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  station_name text not null,
  station_type text not null check (station_type in ('metro', 'bus')),
  city text not null check (city in ('hcmc')),
  rating smallint not null check (rating between 1 and 5),
  text text not null,
  image_url text,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;
create policy "Reviews readable by all" on reviews for select using (true);
create policy "Auth users can insert reviews" on reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on reviews for update using (auth.uid() = user_id);
create policy "Users can delete own reviews" on reviews for delete using (auth.uid() = user_id);

create index idx_reviews_city on reviews(city);
create index idx_reviews_created_at on reviews(created_at desc);

-- Review likes
create table review_likes (
  user_id uuid not null references profiles(id) on delete cascade,
  review_id uuid not null references reviews(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);

alter table review_likes enable row level security;
create policy "Likes readable by all" on review_likes for select using (true);
create policy "Auth users can like" on review_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on review_likes for delete using (auth.uid() = user_id);

-- Update likes_count on reviews when like is added/removed
create or replace function update_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update reviews set likes_count = likes_count + 1 where id = new.review_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update reviews set likes_count = likes_count - 1 where id = old.review_id;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on review_likes
  for each row execute function update_likes_count();

-- Ticket scans
create table ticket_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  image_url text not null,
  ocr_text text,
  route_detected text,
  points_awarded integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

alter table ticket_scans enable row level security;
create policy "Users can view own scans" on ticket_scans for select using (auth.uid() = user_id);
create policy "Auth users can insert scans" on ticket_scans for insert with check (auth.uid() = user_id);

create index idx_ticket_scans_user on ticket_scans(user_id);

-- Update points on verified scan
create or replace function update_points_on_verify()
returns trigger as $$
begin
  if new.status = 'verified' and old.status != 'verified' then
    update profiles
    set total_points = total_points + new.points_awarded,
        tier = case
          when total_points + new.points_awarded >= 2000 then 'diamond'
          when total_points + new.points_awarded >= 1000 then 'gold'
          when total_points + new.points_awarded >= 500 then 'silver'
          else 'bronze'
        end
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_scan_verified
  after update on ticket_scans
  for each row execute function update_points_on_verify();
