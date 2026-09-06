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

  const inputClass =
    "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-orange focus:outline-none";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        {/* 料理の写真：白い背景を乗算合成でクリーム色になじませている */}
        <div className="mx-auto mb-6 w-full max-w-[280px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-plate.jpg"
            alt="お皿に盛られた料理と、その両側に置かれたフォークとナイフ"
            className="w-full mix-blend-multiply"
          />
        </div>

        <h1 className="text-center font-serif text-2xl tracking-wide text-ink">
          お店リスト
        </h1>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-ink-soft">
          行きたいお店、
          <br />
          行ってよかったお店を残しておく場所。
        </p>

        <div className="mt-7 rounded-2xl border border-line bg-surface shadow-card p-6">
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">
                  メールアドレス
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              {errorMessage && (
                <p className="text-[13px] text-orange">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-orange py-3 text-sm font-medium text-white transition-colors hover:bg-orange-dark disabled:opacity-50"
              >
                {busy ? "送信中..." : "ログイン用コードを送る"}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-ink-soft">
                パスワードは不要です。
                <br />
                メールに届く数字を入力するだけでログインできます。
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <span className="text-ink">{email}</span>{" "}
                にログイン用コードを送りました。メールに記載された数字を入力してください。
              </p>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">
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
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 text-center text-lg tracking-[0.3em] focus:border-orange focus:outline-none"
                />
              </div>

              {errorMessage && (
                <p className="text-[13px] text-orange">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-orange py-3 text-sm font-medium text-white transition-colors hover:bg-orange-dark disabled:opacity-50"
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
                className="w-full text-[13px] text-ink-soft transition-colors hover:text-ink"
              >
                メールアドレスを入力し直す
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
