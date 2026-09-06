"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deleteRestaurant, getRestaurant } from "@/lib/restaurants";
import type { Restaurant } from "@/lib/types";
import { RestaurantForm } from "@/components/RestaurantForm";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getRestaurant(id)
      .then(setRestaurant)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("このお店を削除しますか？この操作は取り消せません。")) return;
    setDeleting(true);
    await deleteRestaurant(id);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-ink-soft">読み込み中...</p>;
  }

  if (!restaurant) {
    return (
      <p className="py-10 text-center text-sm text-ink-soft">
        お店が見つかりませんでした。
      </p>
    );
  }

  if (editing) {
    return (
      <div>
        <h1 className="mb-5 font-bold text-xl text-ink">お店を編集</h1>
        <RestaurantForm restaurant={restaurant} />
      </div>
    );
  }

  const been = restaurant.status === "been";

  return (
    <div className="space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-[13px] text-ink-soft transition-colors hover:text-ink"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        一覧にもどる
      </Link>

      {restaurant.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={restaurant.photo_url}
          alt={restaurant.name}
          className="h-56 w-full rounded-2xl object-cover"
        />
      )}

      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-bold text-2xl leading-snug text-ink">
            {restaurant.name}
          </h1>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              been ? "bg-green-bg text-green-ink" : "bg-yellow-bg text-yellow-ink"
            }`}
          >
            {been ? "行った" : "行きたい"}
          </span>
        </div>

        {restaurant.rating ? (
          <p className="mt-2 text-lg leading-none text-star">
            {"★".repeat(restaurant.rating)}
            <span className="text-line">
              {"★".repeat(5 - restaurant.rating)}
            </span>
          </p>
        ) : null}

        {restaurant.genre.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {restaurant.genre.map((g) => (
              <span
                key={g}
                className="rounded-full bg-surface-alt px-2.5 py-1 text-[12px] text-ink-soft"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      {restaurant.memo && (
        <div className="rounded-2xl border-2 border-line bg-surface shadow-card p-5">
          <h2 className="mb-2 font-bold text-[15px] text-ink">感想メモ</h2>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
            {restaurant.memo}
          </p>
        </div>
      )}

      {restaurant.address && (
        <div className="overflow-hidden rounded-2xl border-2 border-line bg-surface shadow-card">
          {MAPS_API_KEY && (
            <iframe
              className="h-52 w-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${encodeURIComponent(
                restaurant.address
              )}`}
            />
          )}
          <div className="p-4">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              {restaurant.address}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {restaurant.google_maps_url && (
                <a
                  href={restaurant.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border-2 border-line px-3.5 py-1.5 text-[12px] text-ink transition-colors hover:bg-surface-alt"
                >
                  Googleマップで開く
                </a>
              )}
              {restaurant.website_url && (
                <a
                  href={restaurant.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border-2 border-line px-3.5 py-1.5 text-[12px] text-ink transition-colors hover:bg-surface-alt"
                >
                  公式サイト
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {!restaurant.address && restaurant.website_url && (
        <a
          href={restaurant.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full border-2 border-line px-3.5 py-1.5 text-[12px] text-ink transition-colors hover:bg-surface-alt"
        >
          公式サイト
        </a>
      )}

      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() => setEditing(true)}
          className="flex-1 rounded-xl bg-lime py-3.5 text-[15px] font-bold text-ink shadow-card transition-colors hover:bg-lime-deep"
        >
          編集する
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-xl border-2 border-line px-5 py-3 text-sm text-ink-soft transition-colors hover:bg-surface-alt disabled:opacity-50"
        >
          {deleting ? "削除中..." : "削除"}
        </button>
      </div>
    </div>
  );
}
