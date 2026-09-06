"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-soft">
        読み込み中...
      </div>
    );
  }

  return (
    // 画面いっぱいの枠。ヘッダーとナビは動かず、中央だけがスクロールする
    <div className="flex h-full flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <Header />
      <main className="app-scroll min-h-0 flex-1">
        <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-5">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
