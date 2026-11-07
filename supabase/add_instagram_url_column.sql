-- 登録元のインスタ投稿（またはリール）のURLを保存する列を追加する
alter table public.restaurants
  add column if not exists instagram_url text;
