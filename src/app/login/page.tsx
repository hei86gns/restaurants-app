"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Step = "email" | "code";

export default function LoginPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!loading && session) {
      router.replace("/");
    }
  }, [loading, session, router]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOtp({ email });

    setBusy(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMessage("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    setBusy(false);

    if (error) {
      setErrorMessage(
        "コードが正しくないか、有効期限が切れています。もう一度お試しください。"
      );
      return;
    }

    router.replace("/");
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">お店リスト</h1>
        <p className="text-center text-slate-500 mb-8">
          行きたい店・行ってよかった店を記録しよう
        </p>

        {step === "email" ? (
          <form
            onSubmit={handleSendCode}
            className="rounded-lg bg-white border border-slate-200 p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "送信中..." : "ログイン用コードを送る"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyCode}
            className="rounded-lg bg-white border border-slate-200 p-6 space-y-4"
          >
            <p className="text-sm text-slate-600">
              {email} にログイン用コードを送りました。メールに記載された数字を入力してください。
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ログイン用コード
              </label>
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="12345678"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "確認中..." : "ログイン"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setErrorMessage("");
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              メールアドレスを入力し直す
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
