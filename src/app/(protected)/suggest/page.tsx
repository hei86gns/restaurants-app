"use client";

import { useEffect, useMemo, useState } from "react";
import { listRestaurants } from "@/lib/restaurants";
import type { Restaurant } from "@/lib/types";
import { RestaurantCard } from "@/components/RestaurantCard";

export default function SuggestPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [suggestion, setSuggestion] = useState<Restaurant | null>(null);

  useEffect(() => {
    listRestaurants()
      .then(setRestaurants)
      .finally(() => setLoading(false));
  }, []);

  const wantToGo = useMemo(
    () => restaurants.filter((r) => r.status === "want_to_go"),
    [restaurants]
  );

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    wantToGo.forEach((r) => r.genre.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [wantToGo]);

  const candidates = useMemo(
    () =>
      genreFilter === "all"
        ? wantToGo
        : wantToGo.filter((r) => r.genre.includes(genreFilter)),
    [wantToGo, genreFilter]
  );

  function handleSuggest() {
    if (candidates.length === 0) {
      setSuggestion(null);
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setSuggestion(pick);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">今日どこ行く？</h1>

      {loading ? (
        <p className="text-sm text-slate-400">読み込み中...</p>
      ) : wantToGo.length === 0 ? (
        <p className="text-sm text-slate-400">
          「行きたい」ステータスのお店がまだありません。
        </p>
      ) : (
        <>
          {allGenres.length > 0 && (
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="all">気分（ジャンル）を選ばない</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleSuggest}
            disabled={candidates.length === 0}
            className="w-full rounded-md bg-slate-900 text-white py-3 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            提案してもらう（{candidates.length}件から抽選）
          </button>

          {suggestion && (
            <div>
              <p className="text-sm text-slate-500 mb-2">今日のおすすめ：</p>
              <RestaurantCard restaurant={suggestion} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
