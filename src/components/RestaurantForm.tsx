"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  createRestaurant,
  listRestaurants,
  saveRestaurantPhotos,
  updateRestaurant,
} from "@/lib/restaurants";
import { collectAreas, guessAreaFromAddress } from "@/lib/area";
import type { PhotoDraft, Restaurant, RestaurantStatus } from "@/lib/types";

/** 1店舗あたりの写真の上限（保存容量を使いすぎないための目安） */
const MAX_PHOTOS = 10;

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

  const [photos, setPhotos] = useState<PhotoDraft[]>(
    () =>
      restaurant?.photos.map((p) => ({
        key: p.id,
        url: p.url,
        previewUrl: p.url,
      })) ?? []
  );

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

  function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`写真は1店舗につき${MAX_PHOTOS}枚までです。`);
      e.target.value = "";
      return;
    }

    const added = files.slice(0, room).map((file) => ({
      key: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotos((current) => [...current, ...added]);
    setError(files.length > room ? `写真は${MAX_PHOTOS}枚までのため、${room}枚だけ追加しました。` : "");
    // 同じファイルをもう一度選べるように入力欄を空にする
    e.target.value = "";
  }

  function handlePhotoRemove(key: string) {
    setPhotos((current) => current.filter((p) => p.key !== key));
  }

  /** 選んだ写真を先頭（表紙）に移動する */
  function handleMakeCover(key: string) {
    setPhotos((current) => {
      const target = current.find((p) => p.key === key);
      if (!target) return current;
      return [target, ...current.filter((p) => p.key !== key)];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError("");

    try {
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
        memo: memo || null,
        rating: rating || null,
      };

      const saved = isEdit
        ? await updateRestaurant(restaurant!.id, input)
        : await createRestaurant(input, session.user.id);

      await saveRestaurantPhotos(
        saved.id,
        session.user.id,
        photos,
        restaurant?.photos ?? []
      );

      router.push(`/restaurants/${saved.id}`);
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

          {photos.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-2.5">
              {photos.map((photo, index) => (
                <div key={photo.key} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className={`aspect-square w-full rounded-xl object-cover ${
                      index === 0
                        ? "border-[3px] border-lime-deep"
                        : "border-2 border-line"
                    }`}
                  />

                  {index === 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-ink">
                      表紙
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePhotoRemove(photo.key)}
                    aria-label="この写真を削除"
                    className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-ink text-white"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>

                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleMakeCover(photo.key)}
                      className="mt-1 w-full rounded-lg border-2 border-line bg-surface py-1 text-[11px] text-ink-soft transition-colors hover:bg-surface-alt"
                    >
                      表紙にする
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <label
            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-line py-4 text-[13px] font-bold text-ink-soft transition-colors hover:bg-surface-alt ${
              photos.length >= MAX_PHOTOS ? "pointer-events-none opacity-40" : ""
            }`}
          >
            ＋ 写真を追加（{photos.length} / {MAX_PHOTOS}枚）
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoAdd}
              className="hidden"
            />
          </label>

          <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
            まとめて選べます。大きな写真は自動で縮小して保存します。
            <br />
            一覧に出るのは「表紙」の1枚です。
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
