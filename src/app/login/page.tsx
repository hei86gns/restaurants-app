"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

/**
 * ログインの流れ
 *  password : メールアドレス＋パスワードでログイン（通常）
 *  code     : パスワードを忘れた／未設定のとき、メールのコードで本人確認
 *  newPass  : 本人確認のあと、新しいパスワードを決める
 */
type Step = "password" | "code" | "newPass";

const inputClass =
  "w-full rounded-xl border-2 border-line px-3.5 py-3 text-[15px] focus:border-blue focus:outline-none";
const labelClass = "mb-1.5 block text-[13px] font-bold text-ink";
const primaryButtonClass =
  "w-full rounded-2xl bg-blue py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-blue-dark disabled:opacity-50";

export default function LoginPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && session && step !== "newPass") {
      router.replace("/");
    }
  }, [loading, session, step, router]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setErrorMessage(
        "メールアドレスかパスワードが違います。まだパスワードを設定していない場合は、下の「パスワードを忘れた・まだ設定していない方」から進んでください。"
      );
      return;
    }

    router.replace("/");
  }

  async function handleSendCode() {
    if (!email) {
      setErrorMessage("先にメールアドレスを入力してください。");
      return;
    }
    setBusy(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOtp({ email });

    setBusy(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNotice(`${email} に確認コードを送りました。`);
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

    setNotice("本人確認ができました。新しいパスワードを決めてください。");
    setStep("newPass");
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      setErrorMessage("パスワードは8文字以上にしてください。");
      return;
    }

    setBusy(true);
    setErrorMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setBusy(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/");
  }

  function backToPasswordStep() {
    setStep("password");
    setCode("");
    setNewPassword("");
    setErrorMessage("");
    setNotice("");
  }

  return (
    <main className="app-scroll flex h-full flex-col items-center px-6 py-10 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="my-auto w-full max-w-sm">
        <div className="mx-auto mb-6 w-full max-w-[280px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-plate.jpg"
            alt="お皿に盛られた料理と、その両側に置かれたフォークとナイフ"
            className="w-full rounded-2xl border-2 border-line shadow-card"
          />
        </div>

        <h1 className="text-center text-[26px] font-bold tracking-wide text-ink">
          お店リスト
        </h1>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-ink-soft">
          行きたいお店、
          <br />
          行ってよかったお店を残しておく場所。
        </p>

        <div className="mt-7 rounded-2xl border-2 border-line bg-surface p-6 shadow-card">
          {notice && (
            <p className="mb-4 rounded-xl bg-blue-pale px-4 py-3 text-[13px] text-ink">
              {notice}
            </p>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className={labelClass}>メールアドレス</label>
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

              <div>
                <label className={labelClass}>パスワード</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              {errorMessage && (
                <p className="rounded-xl bg-yellow-bg px-4 py-3 text-[13px] leading-relaxed text-yellow-ink">
                  {errorMessage}
                </p>
              )}

              <button type="submit" disabled={busy} className={primaryButtonClass}>
                {busy ? "確認中..." : "ログイン"}
              </button>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={busy}
                className="w-full text-[13px] font-bold text-blue underline-offset-2 hover:underline disabled:opacity-50"
              >
                パスワードを忘れた・まだ設定していない方
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className={labelClass}>確認コード</label>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="12345678"
                  className="w-full rounded-xl border-2 border-line px-3.5 py-3 text-center text-lg tracking-[0.3em] focus:border-blue focus:outline-none"
                />
              </div>

              {errorMessage && (
                <p className="rounded-xl bg-yellow-bg px-4 py-3 text-[13px] leading-relaxed text-yellow-ink">
                  {errorMessage}
                </p>
              )}

              <button type="submit" disabled={busy} className={primaryButtonClass}>
                {busy ? "確認中..." : "コードを確認する"}
              </button>

              <button
                type="button"
                onClick={backToPasswordStep}
                className="w-full text-[13px] text-ink-soft hover:text-ink"
              >
                もどる
              </button>
            </form>
          )}

          {step === "newPass" && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className={labelClass}>新しいパスワード</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8文字以上"
                  className={inputClass}
                />
              </div>

              {errorMessage && (
                <p className="rounded-xl bg-yellow-bg px-4 py-3 text-[13px] leading-relaxed text-yellow-ink">
                  {errorMessage}
                </p>
              )}

              <button type="submit" disabled={busy} className={primaryButtonClass}>
                {busy ? "設定中..." : "このパスワードにする"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
