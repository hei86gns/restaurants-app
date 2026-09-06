import Link from "next/link";
import type { Restaurant } from "@/lib/types";

function StatusBadge({ status }: { status: Restaurant["status"] }) {
  const been = status === "been";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        been ? "bg-green-bg text-green-ink" : "bg-yellow-bg text-yellow-ink"
      }`}
    >
      {been ? "行った" : "行きたい"}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[14px] leading-none tracking-[0.05em] text-star">
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function PhotoPlaceholder() {
  return (
    <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-xl bg-surface-alt">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9dbb6e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11" />
        <path d="M17.5 3c-1.4 1.2-2 3.2-2 5.2s.6 3.3 2 3.3 2-1.3 2-3.3-.6-4-2-5.2zM17.5 11.5V21" />
      </svg>
    </div>
  );
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const been = restaurant.status === "been";

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className={`flex items-start gap-4 rounded-2xl border-2 border-line border-l-[7px] bg-surface p-4 shadow-card transition-shadow hover:shadow-lift ${
        been ? "border-l-green-line" : "border-l-yellow-line"
      }`}
    >
      {restaurant.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={restaurant.photo_url}
          alt=""
          className="h-[84px] w-[84px] shrink-0 rounded-xl object-cover"
        />
      ) : (
        <PhotoPlaceholder />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[17px] font-bold text-ink">
            {restaurant.name}
          </p>
          <StatusBadge status={restaurant.status} />
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          {restaurant.area && (
            <span className="shrink-0 text-[12px] font-bold text-ink-soft">
              📍{restaurant.area}
            </span>
          )}
          {restaurant.rating ? <Stars rating={restaurant.rating} /> : null}
        </div>

        {restaurant.genre.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {restaurant.genre.map((g) => (
              <span
                key={g}
                className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] text-ink-soft"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {restaurant.memo && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
            {restaurant.memo}
          </p>
        )}
      </div>
    </Link>
  );
}
