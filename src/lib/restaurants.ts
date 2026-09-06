import { supabase } from "./supabase";
import { compressImage } from "./image";
import type { Restaurant, RestaurantInput } from "./types";

const PHOTO_BUCKET = "restaurant-photos";

export async function listRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Restaurant[];
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Restaurant;
}

export async function createRestaurant(
  input: RestaurantInput,
  userId: string
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from("restaurants")
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as Restaurant;
}

export async function updateRestaurant(
  id: string,
  input: Partial<RestaurantInput>
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from("restaurants")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Restaurant;
}

export async function deleteRestaurant(id: string): Promise<void> {
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadRestaurantPhoto(
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

/** 使わなくなった写真を保存先から消す（失敗しても処理は止めない） */
export async function deleteRestaurantPhoto(url: string): Promise<void> {
  const path = photoPathFromUrl(url);
  if (!path) return;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}
