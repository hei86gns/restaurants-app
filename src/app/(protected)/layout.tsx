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
      <main className="flex flex-1 items-center justify-center text-sm text-ink-soft">
        読み込み中...
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-32 pt-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
