"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
    return <p className="text-sm text-slate-400">読み込み中...</p>;
  }

  if (!restaurant) {
    return <p className="text-sm text-slate-400">お店が見つかりませんでした。</p>;
  }

  if (editing) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6">お店を編集</h1>
        <RestaurantForm restaurant={restaurant} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{restaurant.name}</h1>
          {restaurant.genre.length > 0 && (
            <p className="mt-1 flex flex-wrap gap-1">
              {restaurant.genre.map((g) => (
                <span
                  key={g}
                  className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5"
                >
                  {g}
                </span>
              ))}
            </p>
          )}
        </div>
        <span
          className={`text-xs rounded-full px-2 py-0.5 font-medium shrink-0 ${
            restaurant.status === "been"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {restaurant.status === "been" ? "行った" : "行きたい"}
        </span>
      </div>

      {restaurant.rating && (
        <p className="text-amber-500 text-lg">
          {"★".repeat(restaurant.rating)}
          {"☆".repeat(5 - restaurant.rating)}
        </p>
      )}

      {restaurant.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={restaurant.photo_url}
          alt={restaurant.name}
          className="w-full max-h-64 rounded-lg object-cover"
        />
      )}

      {restaurant.address && MAPS_API_KEY && (
        <iframe
          className="w-full h-56 rounded-lg border border-slate-200"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${encodeURIComponent(
            restaurant.address
          )}`}
        />
      )}

      {restaurant.address && (
        <p className="text-sm text-slate-600">{restaurant.address}</p>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {restaurant.google_maps_url && (
          <a
            href={restaurant.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Googleマップで開く
          </a>
        )}
        {restaurant.website_url && (
          <a
            href={restaurant.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            公式サイト
          </a>
        )}
      </div>

      {restaurant.memo && (
        <div>
          <h2 className="text-sm font-medium text-slate-700 mb-1">感想メモ</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {restaurant.memo}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
        >
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md border border-red-200 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "削除中..." : "削除"}
        </button>
      </div>
    </div>
  );
}
