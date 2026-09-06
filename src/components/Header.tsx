"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function Header() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-10 bg-lime pt-[env(safe-area-inset-top)] shadow-[0_2px_10px_rgba(60,80,30,0.18)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-[19px] font-bold tracking-wide text-ink"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11" />
            <path d="M17.5 3c-1.4 1.2-2 3.2-2 5.2s.6 3.3 2 3.3 2-1.3 2-3.3-.6-4-2-5.2zM17.5 11.5V21" />
          </svg>
          お店リスト
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-full bg-white/50 px-3 py-1.5 text-[12px] font-bold text-ink transition-colors hover:bg-white/80"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
