import { supabase } from "./supabase";
import type { Restaurant, RestaurantInput } from "./types";

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
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("restaurant-photos")
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("restaurant-photos")
    .getPublicUrl(path);

  return data.publicUrl;
}
