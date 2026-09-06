"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

function DiceIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const isList = pathname === "/";
  const isSuggest = pathname === "/suggest";

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-line bg-surface shadow-[0_-2px_16px_rgba(120,70,20,0.14)]">
      <div className="mx-auto flex max-w-2xl items-end justify-around px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <Link
          href="/"
          className={`flex w-20 flex-col items-center gap-1 py-1 text-[11px] ${
            isList ? "text-orange" : "text-ink-soft"
          }`}
        >
          <ListIcon active={isList} />
          <span className={isList ? "font-semibold" : ""}>一覧</span>
        </Link>

        <Link
          href="/restaurants/new"
          aria-label="お店を追加"
          className="-mt-6 flex flex-col items-center gap-1"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange text-white shadow-[0_4px_14px_rgba(194,74,11,0.4)] transition-colors hover:bg-orange-dark">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="text-[11px] text-ink-soft">追加</span>
        </Link>

        <Link
          href="/suggest"
          className={`flex w-20 flex-col items-center gap-1 py-1 text-[11px] ${
            isSuggest ? "text-orange" : "text-ink-soft"
          }`}
        >
          <DiceIcon active={isSuggest} />
          <span className={isSuggest ? "font-semibold" : ""}>今日どこ行く</span>
        </Link>
      </div>
    </nav>
  );
}
