export type RestaurantStatus = "want_to_go" | "been";

/** 1店舗にひもづく写真（sort_order が 0 のものが表紙） */
export type RestaurantPhoto = {
  id: string;
  restaurant_id: string;
  url: string;
  sort_order: number;
};

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
  /** 登録のもとになったインスタ投稿・リールのURL */
  instagram_url: string | null;
  memo: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  /** 並び順で整列済みの写真一覧 */
  photos: RestaurantPhoto[];
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
  instagram_url: string | null;
  memo: string | null;
  rating: number | null;
};

/** 保存したい写真の並び（既存はurlのみ、新規追加はfileを持つ） */
export type PhotoDraft = {
  /** 画面上で一意に扱うための一時的なID */
  key: string;
  /** 既にアップロード済みの写真のURL */
  url?: string;
  /** これからアップロードするファイル */
  file?: File;
  /** 画面に表示するためのURL（既存URLか、選択直後のプレビュー） */
  previewUrl: string;
};
