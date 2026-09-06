"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  createRestaurant,
  updateRestaurant,
  uploadRestaurantPhoto,
} from "@/lib/restaurants";
import type { Restaurant, RestaurantStatus } from "@/lib/types";

function buildGoogleMapsUrl(name: string, address: string): string {
  const query = [name, address].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

export function RestaurantForm({
  restaurant,
}: {
  restaurant?: Restaurant;
}) {
  const { session } = useAuth();
  const router = useRouter();
  const isEdit = !!restaurant;

  const [name, setName] = useState(restaurant?.name ?? "");
  const [genreText, setGenreText] = useState(
    restaurant?.genre.join(", ") ?? ""
  );
  const [status, setStatus] = useState<RestaurantStatus>(
    restaurant?.status ?? "want_to_go"
  );
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(restaurant?.website_url ?? "");
  const [memo, setMemo] = useState(restaurant?.memo ?? "");
  const [rating, setRating] = useState<number>(restaurant?.rating ?? 0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    restaurant?.photo_url ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError("");

    try {
      let photoUrl = restaurant?.photo_url ?? null;
      if (photoFile) {
        photoUrl = await uploadRestaurantPhoto(photoFile, session.user.id);
      }

      const genre = genreText
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const input = {
        name,
        genre,
        status,
        address: address || null,
        lat: null,
        lng: null,
        google_maps_url: address ? buildGoogleMapsUrl(name, address) : null,
        website_url: websiteUrl || null,
        photo_url: photoUrl,
        memo: memo || null,
        rating: rating || null,
      };

      if (isEdit) {
        await updateRestaurant(restaurant!.id, input);
        router.push(`/restaurants/${restaurant!.id}`);
      } else {
        const created = await createRestaurant(input, session.user.id);
        router.push(`/restaurants/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          店名 *
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          ジャンル・タグ（カンマ区切り）
        </label>
        <input
          value={genreText}
          onChange={(e) => setGenreText(e.target.value)}
          placeholder="カフェ, ランチ, 和食"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          ステータス
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as RestaurantStatus)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="want_to_go">行きたい</option>
          <option value="been">行った</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          住所
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="東京都渋谷区..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <p className="mt-1 text-xs text-slate-400">
          店名と住所からGoogleマップのリンクを自動作成します。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          公式サイトURL
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          写真
        </label>
        {photoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPreview}
            alt=""
            className="mb-2 h-32 w-32 rounded-md object-cover"
          />
        )}
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          評価
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(rating === n ? 0 : n)}
              className="text-2xl leading-none"
            >
              {n <= rating ? (
                <span className="text-amber-500">★</span>
              ) : (
                <span className="text-slate-300">★</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          感想メモ
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "保存中..." : isEdit ? "更新する" : "登録する"}
      </button>
    </form>
  );
}
