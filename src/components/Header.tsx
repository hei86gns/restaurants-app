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
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-slate-900">
          お店リスト
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            一覧
          </Link>
          <Link
            href="/suggest"
            className="text-slate-600 hover:text-slate-900"
          >
            今日どこ行く？
          </Link>
          <Link
            href="/restaurants/new"
            className="rounded-md bg-slate-900 text-white px-3 py-1.5 font-medium hover:bg-slate-800"
          >
            追加
          </Link>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-600"
          >
            ログアウト
          </button>
        </nav>
      </div>
    </header>
  );
}
