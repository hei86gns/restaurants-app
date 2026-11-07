"use client";

import { useState } from "react";
import { parsePastedText, type PasteParseResult } from "@/lib/pasteParser";

export type PasteImportValues = {
  name: string;
  address: string;
  genres: string[];
  websiteUrl: string;
  memo: string;
};

type Props = {
  values: PasteImportValues;
  onChange: (patch: Partial<PasteImportValues>) => void;
};

const chipBase =
  "rounded-full px-3 py-1.5 text-[13px] transition-colors text-left";
const chipOn = "bg-lime font-bold text-ink";
const chipOff = "border-2 border-line bg-surface text-ink-soft";

/**
 * インスタなどからコピーした文章を貼り付けると、
 * 住所・店名候補・ジャンルなどに振り分けて登録フォームへ入れるカード。
 */
export function PasteImport({ values, onChange }: Props) {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");
  const [result, setResult] = useState<PasteParseResult | null>(null);
  const [notice, setNotice] = useState("");

  /** 読み取った結果を、まだ空の項目にだけ入れる（入力済みの内容は上書きしない） */
  function analyze(raw: string) {
    const parsed = parsePastedText(raw);
    setResult(parsed);

    const patch: Partial<PasteImportValues> = {};
    if (!values.name.trim()) {
      const name = parsed.confidentName || parsed.nameCandidates[0];
      if (name) patch.name = name;
    }
    if (!values.address.trim() && parsed.address) patch.address = parsed.address;
    if (values.genres.length === 0 && parsed.genres.length > 0) {
      patch.genres = parsed.genres;
    }
    if (!values.websiteUrl.trim() && parsed.websiteUrl) {
      patch.websiteUrl = parsed.websiteUrl;
    }
    onChange(patch);

    const found = parsed.address || parsed.nameCandidates.length > 0;
    setNotice(
      found
        ? "読み取りました。下の候補をタップすると入れ替えられます。"
        : "店名や住所が見つかりませんでした。文章をそのまま貼り付けたか確認してください。"
    );
  }

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        setNotice("コピーした文字がありません。先に文字をコピーしてください。");
        return;
      }
      setText(clip);
      analyze(clip);
    } catch {
      setNotice("貼り付けを許可できませんでした。下の欄を長押しして「ペースト」してください。");
    }
  }

  function toggleGenre(genre: string) {
    const has = values.genres.includes(genre);
    onChange({
      genres: has
        ? values.genres.filter((g) => g !== genre)
        : [...values.genres, genre],
    });
  }

  function addInfoToMemo(lines: string[]) {
    const info = lines.join("\n");
    if (values.memo.includes(info)) return;
    onChange({ memo: values.memo ? `${values.memo}\n${info}` : info });
  }

  function reset() {
    setText("");
    setResult(null);
    setNotice("");
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-blue bg-surface p-5 shadow-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-bold text-ink">
          📋 インスタの文章から入力
        </span>
        <span className="text-[13px] text-ink-soft">{open ? "閉じる" : "開く"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-[12px] leading-relaxed text-ink-soft">
            <li>インスタの投稿をスクショする</li>
            <li>写真アプリでスクショを開き、文字を長押し →「すべてを選択」→「コピー」</li>
            <li>下のボタンを押す（または欄に貼り付けて「読み取る」）</li>
          </ol>

          <button
            type="button"
            onClick={pasteFromClipboard}
            className="w-full rounded-xl bg-blue py-3 text-[15px] font-bold text-white transition-colors hover:bg-blue-dark"
          >
            コピーした文章を貼り付けて読み取る
          </button>

          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="ここに貼り付けてもOK"
              className="w-full rounded-xl border-2 border-line px-3.5 py-2.5 text-[14px] focus:border-blue focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => analyze(text)}
                disabled={!text.trim()}
                className="flex-1 rounded-xl border-2 border-blue py-2 text-[13px] font-bold text-blue disabled:opacity-40"
              >
                読み取る
              </button>
              {(text || result) && (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border-2 border-line px-4 py-2 text-[13px] text-ink-soft"
                >
                  クリア
                </button>
              )}
            </div>
          </div>

          {notice && (
            <p className="rounded-xl bg-surface-alt px-3.5 py-2.5 text-[12px] text-ink">
              {notice}
            </p>
          )}

          {result && (
            <div className="space-y-4">
              {result.nameCandidates.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[12px] font-bold text-ink">
                    店名はどれ？（タップで決定）
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.nameCandidates.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onChange({ name: c })}
                        className={`${chipBase} ${values.name === c ? chipOn : chipOff}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {result.address && (
                <div>
                  <p className="mb-1.5 text-[12px] font-bold text-ink">見つけた住所</p>
                  <button
                    type="button"
                    onClick={() => onChange({ address: result.address })}
                    className={`${chipBase} ${
                      values.address === result.address ? chipOn : chipOff
                    }`}
                  >
                    {values.address === result.address ? "✓ " : ""}
                    {result.address}
                  </button>
                </div>
              )}

              {result.genres.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[12px] font-bold text-ink">
                    ジャンル（タップで付け外し）
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.genres.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`${chipBase} ${
                          values.genres.includes(g) ? chipOn : chipOff
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {result.infoLines.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[12px] font-bold text-ink">
                    営業時間など
                  </p>
                  <p className="mb-2 whitespace-pre-line text-[12px] text-ink-soft">
                    {result.infoLines.join("\n")}
                  </p>
                  <button
                    type="button"
                    onClick={() => addInfoToMemo(result.infoLines)}
                    className="rounded-lg border-2 border-line px-3 py-1.5 text-[12px] text-ink-soft"
                  >
                    メモに追加する
                  </button>
                </div>
              )}

              <p className="text-[12px] text-ink-soft">
                📷 写真は、そのスクショを下の「写真を追加」から選んでください
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
