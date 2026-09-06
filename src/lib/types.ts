export type RestaurantStatus = "want_to_go" | "been";

export type Restaurant = {
  id: string;
  user_id: string;
  name: string;
  genre: string[];
  status: RestaurantStatus;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  website_url: string | null;
  photo_url: string | null;
  memo: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
};

export type RestaurantInput = {
  name: string;
  genre: string[];
  status: RestaurantStatus;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  website_url: string | null;
  photo_url: string | null;
  memo: string | null;
  rating: number | null;
};
