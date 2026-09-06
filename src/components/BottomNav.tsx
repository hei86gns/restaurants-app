"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function ListIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

function DiceIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const isList = pathname === "/";
  const isSuggest = pathname === "/suggest";

  return (
    <nav className="shrink-0 border-t-2 border-line bg-surface shadow-[0_-2px_16px_rgba(60,80,30,0.14)]">
      <div className="mx-auto flex max-w-2xl items-end justify-around px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <Link
          href="/"
          className={`flex w-20 flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-bold ${
            isList ? "text-blue" : "text-ink-soft"
          }`}
        >
          <ListIcon />
          <span>一覧</span>
        </Link>

        <Link
          href="/restaurants/new"
          aria-label="お店を追加"
          className="-mt-7 flex flex-col items-center gap-1"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-surface bg-blue text-white shadow-[0_4px_14px_rgba(21,101,192,0.45)] transition-colors hover:bg-blue-dark">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="text-[11px] font-bold text-ink-soft">追加</span>
        </Link>

        <Link
          href="/suggest"
          className={`flex w-20 flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-bold ${
            isSuggest ? "text-blue" : "text-ink-soft"
          }`}
        >
          <DiceIcon />
          <span>今日どこ行く</span>
        </Link>
      </div>
    </nav>
  );
}
