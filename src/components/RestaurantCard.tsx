import Link from "next/link";
import type { Restaurant } from "@/lib/types";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate">
            {restaurant.name}
          </p>
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
          {restaurant.memo && (
            <p className="mt-2 text-sm text-slate-500 line-clamp-2">
              {restaurant.memo}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-xs rounded-full px-2 py-0.5 font-medium ${
              restaurant.status === "been"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {restaurant.status === "been" ? "行った" : "行きたい"}
          </span>
          {restaurant.rating && (
            <span className="text-sm text-amber-500">
              {"★".repeat(restaurant.rating)}
              {"☆".repeat(5 - restaurant.rating)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
