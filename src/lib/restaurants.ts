import { supabase } from "./supabase";
import { compressImage } from "./image";
import type {
  PhotoDraft,
  Restaurant,
  RestaurantInput,
  RestaurantPhoto,
} from "./types";

const PHOTO_BUCKET = "restaurant-photos";

/** お店1件分と、その写真をまとめて取ってくるための指定 */
const SELECT_WITH_PHOTOS =
  "*, photos:restaurant_photos(id, restaurant_id, url, sort_order)";

/** 写真を並び順（表紙が先頭）に整える */
function sortPhotos(item: Restaurant): Restaurant {
  const photos = [...(item.photos ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  return { ...item, photos };
}

export async function listRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(SELECT_WITH_PHOTOS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as Restaurant[]).map(sortPhotos);
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(SELECT_WITH_PHOTOS)
    .eq("id", id)
    .single();

  if (error) throw error;
  return sortPhotos(data as unknown as Restaurant);
}

export async function createRestaurant(
  input: RestaurantInput,
  userId: string
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from("restaurants")
    .insert({ ...input, user_id: userId })
    .select(SELECT_WITH_PHOTOS)
    .single();

  if (error) throw error;
  return sortPhotos(data as unknown as Restaurant);
}

export async function updateRestaurant(
  id: string,
  input: Partial<RestaurantInput>
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from("restaurants")
    .update(input)
    .eq("id", id)
    .select(SELECT_WITH_PHOTOS)
    .single();

  if (error) throw error;
  return sortPhotos(data as unknown as Restaurant);
}

export async function deleteRestaurant(id: string): Promise<void> {
  // 先に写真の実体を保存先から消す（テーブルの行はお店の削除と同時に自動で消える）
  const { data } = await supabase
    .from("restaurant_photos")
    .select("url")
    .eq("restaurant_id", id);

  for (const row of data ?? []) {
    await deletePhotoFile(row.url).catch(() => {});
  }

  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------ 写真まわり ------------------------------ */

/** 画像を縮小してから保存先へアップロードし、公開URLを返す */
export async function uploadPhotoFile(
  file: File,
  userId: string
): Promise<string> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, compressed);

  if (error) throw error;

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** 公開URLから保存先のパスを取り出す */
function photoPathFromUrl(url: string): string | null {
  const marker = `/${PHOTO_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

/** 使わなくなった写真の実体を保存先から消す */
export async function deletePhotoFile(url: string): Promise<void> {
  const path = photoPathFromUrl(url);
  if (!path) return;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

/**
 * お店の写真を、画面で並べた通りの内容に置き換える。
 * 新しく選ばれたファイルはアップロードし、外された写真は保存先からも消す。
 */
export async function saveRestaurantPhotos(
  restaurantId: string,
  userId: string,
  drafts: PhotoDraft[],
  previousPhotos: RestaurantPhoto[]
): Promise<void> {
  // 1. 新しく選ばれたファイルをアップロードして、URLの並びを確定させる
  const urls: string[] = [];
  for (const draft of drafts) {
    if (draft.file) {
      urls.push(await uploadPhotoFile(draft.file, userId));
    } else if (draft.url) {
      urls.push(draft.url);
    }
  }

  // 2. 既存の行をいったん全部消してから、並び順どおりに入れ直す
  const { error: deleteError } = await supabase
    .from("restaurant_photos")
    .delete()
    .eq("restaurant_id", restaurantId);

  if (deleteError) throw deleteError;

  if (urls.length > 0) {
    const rows = urls.map((url, index) => ({
      restaurant_id: restaurantId,
      user_id: userId,
      url,
      sort_order: index,
    }));

    const { error: insertError } = await supabase
      .from("restaurant_photos")
      .insert(rows);

    if (insertError) throw insertError;
  }

  // 3. 今回の並びに残らなかった写真は、保存先からも削除する
  const keeping = new Set(urls);
  for (const photo of previousPhotos) {
    if (!keeping.has(photo.url)) {
      await deletePhotoFile(photo.url).catch(() => {});
    }
  }
}
