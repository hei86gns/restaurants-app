"use client";

import { useEffect, useMemo, useState } from "react";
import { listRestaurants } from "@/lib/restaurants";
import type { Restaurant, RestaurantStatus } from "@/lib/types";
import { RestaurantCard } from "@/components/RestaurantCard";

type StatusFilter = RestaurantStatus | "all";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "want_to_go", label: "行きたい" },
  { value: "been", label: "行った" },
];

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [genreFilter, setGenreFilter] = useState("all");
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
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.name.toLowerCase().includes(q) &&
        !(r.memo ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a89383"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          placeholder="店名・メモで探す"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-line py-2.5 pl-10 pr-4 text-sm focus:border-orange focus:outline-none"
        />
      </div>

      <div className="flex gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
              statusFilter === tab.value
                ? "bg-ink font-medium text-cream"
                : "border border-line bg-surface text-ink-soft"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {allGenres.length > 0 && (
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
          <button
            onClick={() => setGenreFilter("all")}
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] transition-colors ${
              genreFilter === "all"
                ? "bg-orange font-medium text-white"
                : "border border-line bg-surface text-ink-soft"
            }`}
          >
            ジャンル全部
          </button>
          {allGenres.map((g) => (
            <button
              key={g}
              onClick={() => setGenreFilter(g)}
              className={`shrink-0 rounded-full px-3 py-1 text-[12px] transition-colors ${
                genreFilter === g
                  ? "bg-orange font-medium text-white"
                  : "border border-line bg-surface text-ink-soft"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-ink-soft">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
          <p className="font-serif text-ink">
            {restaurants.length === 0
              ? "まだお店がありません"
              : "条件に合うお店がありません"}
          </p>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {restaurants.length === 0
              ? "下の「＋」から、気になるお店を登録しましょう。"
              : "絞り込みを変えてみてください。"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-[12px] text-ink-soft">{filtered.length}件</p>
          <div className="space-y-2.5">
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
