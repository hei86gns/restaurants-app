"use client";

import { useEffect, useMemo, useState } from "react";
import { listRestaurants } from "@/lib/restaurants";
import type { Restaurant, RestaurantStatus } from "@/lib/types";
import { RestaurantCard } from "@/components/RestaurantCard";

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RestaurantStatus | "all">(
    "all"
  );
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    listRestaurants()
      .then(setRestaurants)
      .finally(() => setLoading(false));
  }, []);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.genre.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [restaurants]);

  const filtered = restaurants.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (genreFilter !== "all" && !r.genre.includes(genreFilter)) return false;
    if (
      search &&
      !r.name.toLowerCase().includes(search.toLowerCase()) &&
      !(r.memo ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="店名・メモで検索"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
      />

      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as RestaurantStatus | "all")
          }
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="all">すべて</option>
          <option value="want_to_go">行きたい</option>
          <option value="been">行った</option>
        </select>

        {allGenres.length > 0 && (
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="all">ジャンルすべて</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400">
          まだお店が登録されていません。「追加」から登録してみましょう。
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
