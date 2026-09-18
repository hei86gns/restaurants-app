"use client";

import { useState } from "react";
import type { RestaurantPhoto } from "@/lib/types";

/**
 * 詳細画面の写真表示。
 * 1枚のときはそのまま、複数枚のときは下に小さな一覧を並べて切り替えられるようにする。
 */
export function PhotoGallery({
  photos,
  alt,
}: {
  photos: RestaurantPhoto[];
  alt: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photos.length === 0) return null;

  // 写真が減ったときに備えて、範囲外なら先頭に戻す
  const index = currentIndex < photos.length ? currentIndex : 0;
  const current = photos[index];

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={alt}
          className="h-60 w-full rounded-2xl border-2 border-line object-cover"
        />
        {photos.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-bold text-white">
            {index + 1} / {photos.length}
          </span>
        )}
      </div>

      {photos.length > 1 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`${i + 1}枚目の写真を表示`}
              className="shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                className={`h-16 w-16 rounded-xl object-cover transition-opacity ${
                  i === index
                    ? "border-[3px] border-lime-deep"
                    : "border-2 border-line opacity-70"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
