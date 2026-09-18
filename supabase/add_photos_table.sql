-- 1店舗に複数枚の写真を登録できるようにするテーブル
create table if not exists public.restaurant_photos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.restaurants(id) on delete cascade,
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,  -- 0が表紙（一覧に出る写真）
  created_at timestamptz not null default now()
);

create index if not exists restaurant_photos_restaurant_idx
  on public.restaurant_photos (restaurant_id, sort_order);

-- 本人のデータのみ読み書きできるようにする
alter table public.restaurant_photos enable row level security;

drop policy if exists "restaurant_photos_select_own" on public.restaurant_photos;
create policy "restaurant_photos_select_own"
  on public.restaurant_photos for select
  using (auth.uid() = user_id);

drop policy if exists "restaurant_photos_insert_own" on public.restaurant_photos;
create policy "restaurant_photos_insert_own"
  on public.restaurant_photos for insert
  with check (auth.uid() = user_id);

drop policy if exists "restaurant_photos_update_own" on public.restaurant_photos;
create policy "restaurant_photos_update_own"
  on public.restaurant_photos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "restaurant_photos_delete_own" on public.restaurant_photos;
create policy "restaurant_photos_delete_own"
  on public.restaurant_photos for delete
  using (auth.uid() = user_id);

-- 今までの写真（1枚）を新しいテーブルへ引っ越す
-- ※ 既に引っ越し済みのお店は二重登録しないようにしている
insert into public.restaurant_photos (restaurant_id, user_id, url, sort_order)
select r.id, r.user_id, r.photo_url, 0
from public.restaurants r
where r.photo_url is not null
  and not exists (
    select 1 from public.restaurant_photos p
    where p.restaurant_id = r.id
  );
