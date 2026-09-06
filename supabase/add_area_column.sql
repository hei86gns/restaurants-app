-- エリア絞り込み用の列を追加する
-- （大阪・西宮・四日市 など、大まかな地域名を1つ保存する）
alter table public.restaurants
  add column if not exists area text;

-- エリアでの絞り込みを速くするための索引
create index if not exists restaurants_area_idx
  on public.restaurants (user_id, area);
