"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";

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
      <main className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        読み込み中...
      </main>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
