"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  createRestaurant,
  deleteRestaurantPhoto,
  listRestaurants,
  updateRestaurant,
  uploadRestaurantPhoto,
} from "@/lib/restaurants";
import { collectAreas, guessAreaFromAddress } from "@/lib/area";
import type { Restaurant, RestaurantStatus } from "@/lib/types";

function buildGoogleMapsUrl(name: string, address: string): string {
  const query = [name, address].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

const inputClass =
  "w-full rounded-xl border-2 border-line px-3.5 py-2.5 text-[15px] focus:border-blue focus:outline-none";
const labelClass = "mb-1.5 block text-[13px] font-bold text-ink";
const cardClass =
  "rounded-2xl border-2 border-line bg-surface p-5 shadow-card space-y-5";

export function RestaurantForm({ restaurant }: { restaurant?: Restaurant }) {
  const { session } = useAuth();
  const router = useRouter();
  const isEdit = !!restaurant;

  const [name, setName] = useState(restaurant?.name ?? "");
  const [genreText, setGenreText] = useState(restaurant?.genre.join(", ") ?? "");
  const [status, setStatus] = useState<RestaurantStatus>(
    restaurant?.status ?? "want_to_go"
  );
  const [area, setArea] = useState(restaurant?.area ?? "");
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(restaurant?.website_url ?? "");
  const [memo, setMemo] = useState(restaurant?.memo ?? "");
  const [rating, setRating] = useState<number>(restaurant?.rating ?? 0);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    restaurant?.photo_url ?? null
  );
  // 既存の写真を「削除」した場合に立てる目印
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 既に登録済みのエリア名を候補として読み込む
  useEffect(() => {
    listRestaurants()
      .then((items) => setAreaSuggestions(collectAreas(items)))
      .catch(() => {});
  }, []);

  // 住所を入力したとき、エリアが空ならそこから自動で埋める
  function handleAddressChange(value: string) {
    setAddress(value);
    if (!area.trim()) {
      const guessed = guessAreaFromAddress(value);
      if (guessed) setArea(guessed);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setPhotoFile(file);
    setPhotoRemoved(false);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handlePhotoRemove() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoRemoved(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError("");

    try {
      const previousUrl = restaurant?.photo_url ?? null;
      let photoUrl = previousUrl;

      if (photoRemoved) {
        photoUrl = null;
      }
      if (photoFile) {
        photoUrl = await uploadRestaurantPhoto(photoFile, session.user.id);
      }

      // 差し替え・削除で使わなくなった写真は保存先からも消す
      if (previousUrl && previousUrl !== photoUrl) {
        await deleteRestaurantPhoto(previousUrl).catch(() => {});
      }

      const genre = genreText
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const input = {
        name,
        genre,
        status,
        area: area.trim() || null,
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
      <div className={cardClass}>
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
                className={`flex-1 rounded-xl border-2 py-3 text-[15px] transition-colors ${
                  status === opt.value
                    ? opt.value === "been"
                      ? "border-green-line bg-green-bg text-green-ink"
                      : "border-yellow-line bg-yellow-bg text-yellow-ink"
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
          <p className="mt-1.5 text-[12px] text-ink-soft">
            カンマ（,）で区切ると複数登録できます
          </p>
        </div>
      </div>

      <div className={cardClass}>
        <div>
          <label className={labelClass}>住所</label>
          <input
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="東京都渋谷区..."
            className={inputClass}
          />
          <p className="mt-1.5 text-[12px] text-ink-soft">
            入力すると、地図とGoogleマップのリンクが自動で作られます
          </p>
        </div>

        <div>
          <label className={labelClass}>エリア</label>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            list="area-suggestions"
            placeholder="大阪、西宮、四日市 など"
            className={inputClass}
          />
          <datalist id="area-suggestions">
            {areaSuggestions.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
          {areaSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {areaSuggestions.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
                    area === a
                      ? "bg-lime font-bold text-ink"
                      : "border-2 border-line bg-surface text-ink-soft"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
          <p className="mt-1.5 text-[12px] text-ink-soft">
            一覧で地域ごとに絞り込むために使います。住所から自動で入りますが、自由に直せます
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

      <div className={cardClass}>
        <div>
          <label className={labelClass}>写真</label>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt=""
                className="h-24 w-24 rounded-xl border-2 border-line object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-alt text-[12px] text-ink-soft">
                なし
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="cursor-pointer rounded-xl border-2 border-line px-4 py-2 text-center text-[13px] text-ink transition-colors hover:bg-surface-alt">
                {photoPreview ? "写真を変える" : "写真を選ぶ"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>

              {photoPreview && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="rounded-xl border-2 border-line px-4 py-2 text-[13px] text-ink-soft transition-colors hover:bg-surface-alt"
                >
                  写真を削除
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-[12px] text-ink-soft">
            大きな写真は自動で縮小して保存します
          </p>
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
                className="text-[30px] leading-none"
              >
                <span className={n <= rating ? "text-star" : "text-line"}>
                  ★
                </span>
              </button>
            ))}
            {rating > 0 && (
              <button
                type="button"
                onClick={() => setRating(0)}
                className="ml-2 text-[12px] text-ink-soft"
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

      {error && (
        <p className="rounded-xl bg-yellow-bg px-4 py-3 text-[13px] text-yellow-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-2xl bg-blue py-4 text-[15px] font-bold text-white shadow-card transition-colors hover:bg-blue-dark disabled:opacity-50"
      >
        {saving ? "保存中..." : isEdit ? "更新する" : "登録する"}
      </button>
    </form>
  );
}
