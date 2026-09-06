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

const inputClass =
  "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-orange focus:outline-none";
const labelClass = "mb-1.5 block text-[13px] font-medium text-ink";

export function RestaurantForm({ restaurant }: { restaurant?: Restaurant }) {
  const { session } = useAuth();
  const router = useRouter();
  const isEdit = !!restaurant;

  const [name, setName] = useState(restaurant?.name ?? "");
  const [genreText, setGenreText] = useState(restaurant?.genre.join(", ") ?? "");
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
      <div className="rounded-2xl border border-line bg-surface shadow-card p-5 space-y-5">
        <div>
          <label className={labelClass}>店名</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：喫茶さくら"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>ステータス</label>
          <div className="flex gap-2">
            {(
              [
                { value: "want_to_go", label: "行きたい" },
                { value: "been", label: "行った" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${
                  status === opt.value
                    ? "border-orange bg-orange/10 font-medium text-orange"
                    : "border-line bg-surface text-ink-soft"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>ジャンル・タグ</label>
          <input
            value={genreText}
            onChange={(e) => setGenreText(e.target.value)}
            placeholder="カフェ, ランチ, 和食"
            className={inputClass}
          />
          <p className="mt-1.5 text-[11px] text-ink-soft">
            カンマ（,）で区切ると複数登録できます
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-card p-5 space-y-5">
        <div>
          <label className={labelClass}>住所</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="東京都渋谷区..."
            className={inputClass}
          />
          <p className="mt-1.5 text-[11px] text-ink-soft">
            入力すると、地図とGoogleマップのリンクが自動で作られます
          </p>
        </div>

        <div>
          <label className={labelClass}>公式サイトURL</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-card p-5 space-y-5">
        <div>
          <label className={labelClass}>写真</label>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt=""
                className="h-20 w-20 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface-alt text-[11px] text-ink-soft">
                なし
              </div>
            )}
            <label className="cursor-pointer rounded-xl border border-line px-4 py-2 text-[13px] text-ink transition-colors hover:bg-surface-alt">
              写真を選ぶ
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass}>評価</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? 0 : n)}
                aria-label={`${n}つ星`}
                className="text-[26px] leading-none"
              >
                <span className={n <= rating ? "text-gold" : "text-line"}>
                  ★
                </span>
              </button>
            ))}
            {rating > 0 && (
              <button
                type="button"
                onClick={() => setRating(0)}
                className="ml-2 text-[11px] text-ink-soft"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>感想メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={4}
            placeholder="何を食べたか、雰囲気、また行きたいか など"
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-[13px] text-orange">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-orange py-3.5 text-sm font-medium text-white transition-colors hover:bg-orange-dark disabled:opacity-50"
      >
        {saving ? "保存中..." : isEdit ? "更新する" : "登録する"}
      </button>
    </form>
  );
}
