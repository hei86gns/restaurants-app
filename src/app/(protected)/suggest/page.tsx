"use client";

import { useEffect, useMemo, useState } from "react";
import { listRestaurants } from "@/lib/restaurants";
import type { Restaurant } from "@/lib/types";
import { RestaurantCard } from "@/components/RestaurantCard";
import { collectAreas } from "@/lib/area";

export default function SuggestPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [genreFilter, setGenreFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
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

  const allAreas = useMemo(() => collectAreas(wantToGo), [wantToGo]);

  const candidates = useMemo(
    () =>
      wantToGo.filter((r) => {
        if (genreFilter !== "all" && !r.genre.includes(genreFilter)) return false;
        if (areaFilter !== "all" && r.area !== areaFilter) return false;
        return true;
      }),
    [wantToGo, genreFilter, areaFilter]
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
    <div className="space-y-5">
      <div>
        <h1 className="font-bold text-2xl text-ink">今日どこ行く？</h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          「行きたい」リストから選んで提案します。
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-ink-soft">読み込み中...</p>
      ) : wantToGo.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line px-6 py-12 text-center">
          <p className="font-bold text-ink">「行きたい」のお店がありません</p>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            下の「＋」からお店を登録して、
            <br />
            ステータスを「行きたい」にしてみましょう。
          </p>
        </div>
      ) : (
        <>
          {allGenres.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink">今日の気分</p>
              <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
                <button
                  onClick={() => setGenreFilter("all")}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                    genreFilter === "all"
                      ? "bg-blue font-medium text-white"
                      : "border-2 border-line bg-surface text-ink-soft"
                  }`}
                >
                  こだわらない
                </button>
                {allGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenreFilter(g)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                      genreFilter === g
                        ? "bg-blue font-medium text-white"
                        : "border-2 border-line bg-surface text-ink-soft"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSuggest}
            disabled={candidates.length === 0}
            className="w-full rounded-2xl bg-blue py-4 text-[15px] font-medium text-white transition-colors hover:bg-blue-dark disabled:opacity-40"
          >
            {candidates.length === 0
              ? "この条件に合うお店がありません"
              : suggestion
                ? "もう一度選びなおす"
                : `${candidates.length}件から選んでもらう`}
          </button>

          {suggestion && (
            <div className="space-y-2.5 rounded-2xl bg-surface-alt p-4">
              <p className="text-center font-bold text-[15px] text-ink">
                today&apos;s pick
              </p>
              <RestaurantCard restaurant={suggestion} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
