-- restaurants テーブル：行きたい/行った店の記録
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  genre text[] not null default '{}',
  status text not null default 'want_to_go' check (status in ('want_to_go', 'been')),
  address text,
  lat double precision,
  lng double precision,
  google_maps_url text,
  website_url text,
  photo_url text,
  memo text,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at を自動更新するトリガー
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_restaurants_updated_at on public.restaurants;
create trigger set_restaurants_updated_at
  before update on public.restaurants
  for each row
  execute function public.set_updated_at();

-- Row Level Security: 本人のデータのみ読み書き可能にする
alter table public.restaurants enable row level security;

drop policy if exists "restaurants_select_own" on public.restaurants;
create policy "restaurants_select_own"
  on public.restaurants for select
  using (auth.uid() = user_id);

drop policy if exists "restaurants_insert_own" on public.restaurants;
create policy "restaurants_insert_own"
  on public.restaurants for insert
  with check (auth.uid() = user_id);

drop policy if exists "restaurants_update_own" on public.restaurants;
create policy "restaurants_update_own"
  on public.restaurants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "restaurants_delete_own" on public.restaurants;
create policy "restaurants_delete_own"
  on public.restaurants for delete
  using (auth.uid() = user_id);

-- 写真保存用の Storage バケット（本人の写真のみ読み書き可能）
insert into storage.buckets (id, name, public)
values ('restaurant-photos', 'restaurant-photos', true)
on conflict (id) do nothing;

drop policy if exists "restaurant_photos_select_own" on storage.objects;
create policy "restaurant_photos_select_own"
  on storage.objects for select
  using (bucket_id = 'restaurant-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "restaurant_photos_insert_own" on storage.objects;
create policy "restaurant_photos_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'restaurant-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "restaurant_photos_update_own" on storage.objects;
create policy "restaurant_photos_update_own"
  on storage.objects for update
  using (bucket_id = 'restaurant-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "restaurant_photos_delete_own" on storage.objects;
create policy "restaurant_photos_delete_own"
  on storage.objects for delete
  using (bucket_id = 'restaurant-photos' and auth.uid()::text = (storage.foldername(name))[1]);
