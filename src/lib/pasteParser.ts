/**
 * インスタの投稿などから貼り付けた文章を、登録フォームの各項目に振り分ける。
 *
 * iPhone の「テキスト認識表示」でスクショから文字をコピーすると、
 * 投稿の説明文に加えて「いいね！」「フォローする」などの画面の文字も混ざる。
 * それらを取り除いたうえで、ルール（正規表現）で住所・店名候補などを推測する。
 *
 * AI は使わないので精度は完璧ではない。外れてもユーザーが選び直せる前提。
 */

import { normalizeInstagramUrl } from "@/lib/instagram";

export type PasteParseResult = {
  /** 住所と判断した文字列（見つからなければ空文字） */
  address: string;
  /** 店名の候補。確からしい順に並ぶ */
  nameCandidates: string[];
  /** 「店名：」のように明示されていて、ほぼ確実な店名（なければ空文字） */
  confidentName: string;
  /** 文章中に出てきたジャンル */
  genres: string[];
  /** インスタ以外のURL（公式サイトなど） */
  websiteUrl: string;
  /** インスタの投稿・リールのURL（文章に含まれていた場合） */
  instagramUrl: string;
  /** 営業時間・定休日などの行 */
  infoLines: string[];
};

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];
const PREF_PATTERN = new RegExp(`(${PREFECTURES.join("|")})`);

/** 都道府県が省略された住所（例: 大阪市北区梅田1-2-3）を見つける */
const CITY_WITH_NUMBER = /[^\s、。]{1,6}[市区町村郡][^\s]*[0-9０-９一二三四五六七八九十]+(丁目|番|-|－|ー|‐)/;

/** 見つけたら追加するジャンル。[検索する言葉, 登録する名前] */
const GENRE_KEYWORDS: [string | RegExp, string][] = [
  ["カフェ", "カフェ"], ["喫茶", "喫茶店"], ["ラーメン", "ラーメン"],
  ["つけ麺", "つけ麺"], ["うどん", "うどん"], ["蕎麦", "そば"], ["そば屋", "そば"],
  ["寿司", "寿司"], ["鮨", "寿司"], ["焼肉", "焼肉"], ["焼き鳥", "焼き鳥"],
  ["焼鳥", "焼き鳥"], ["居酒屋", "居酒屋"], ["イタリアン", "イタリアン"],
  ["フレンチ", "フレンチ"], ["中華", "中華"], ["韓国料理", "韓国料理"],
  ["タイ料理", "タイ料理"], ["カレー", "カレー"], ["ハンバーガー", "ハンバーガー"],
  ["ベーカリー", "パン"], ["パン屋", "パン"], ["スイーツ", "スイーツ"],
  ["パフェ", "パフェ"], ["かき氷", "かき氷"], [/(?<!ホット|パン)ケーキ/, "ケーキ"],
  ["和菓子", "和菓子"], ["和食", "和食"], ["洋食", "洋食"], ["天ぷら", "天ぷら"],
  ["とんかつ", "とんかつ"], ["定食", "定食"], ["お好み焼", "お好み焼き"],
  ["たこ焼", "たこ焼き"], ["鉄板焼", "鉄板焼き"], ["ステーキ", "ステーキ"],
  ["ビストロ", "ビストロ"], ["餃子", "餃子"], ["ピザ", "ピザ"], ["パスタ", "パスタ"],
  ["海鮮", "海鮮"], ["もつ鍋", "もつ鍋"], ["しゃぶしゃぶ", "しゃぶしゃぶ"],
  ["すき焼", "すき焼き"], ["ランチ", "ランチ"], ["ディナー", "ディナー"],
  ["モーニング", "モーニング"],
];

/** スクショに写り込む、インスタの画面の文字（投稿の中身ではないもの） */
const JUNK_PATTERNS: RegExp[] = [
  /^[0-9０-９:：.,万千件人%％\s]+$/, // 時刻・数字だけ
  /いいね/, /フォロー/, /コメント/, /もっと見る/, /続きを読む/, /翻訳を見る/,
  /^(返信|シェア|保存|送信|投稿|リール|ホーム|検索|プロフィール|メッセージ)/,
  /(秒|分|時間|日|週間|か月)前$/, /^@/, /instagram/i, /^\.{2,}$/, /^…+$/,
  /^(LTE|5G|4G|Wi-?Fi)$/i,
];

/** 行頭の絵文字や記号（📍▶︎■★ など）を取り除く */
function stripLeadingSymbols(line: string): string {
  return line
    .replace(/^[\p{Extended_Pictographic}️‍⃣▶▷►◆◇●○◎■□★☆✓✔・\-－ー＿_~〜>＞|｜\s]+/u, "")
    .trim();
}

function isJunk(line: string): boolean {
  return JUNK_PATTERNS.some((p) => p.test(line));
}

/** 「店名：〇〇」のようなラベル付きの行から値を取り出す */
function takeLabeled(line: string, labels: string): string | null {
  const m = line.match(new RegExp(`^(?:${labels})\\s*[：:]?\\s*(.+)$`, "i"));
  return m ? m[1].trim() : null;
}

const NAME_LABELS = "店名|店舗名|お店|店舗|shop|store|restaurant";
const ADDRESS_LABELS = "住所|所在地|場所|address|access|アクセス";
const INFO_PATTERN = /(営業時間|定休日|休業日|お休み|予算|価格|TEL|Tel|tel|電話|予約|駐車場)/;

/** その行が住所らしいかどうかを点数で表す（0 なら住所ではない） */
function scoreAddress(line: string): number {
  let score = 0;
  if (PREF_PATTERN.test(line)) score += 3;
  if (CITY_WITH_NUMBER.test(line)) score += 3;
  if (/[0-9０-９]+(丁目|番地?|号)|[0-9０-９]+[-－‐][0-9０-９]+/.test(line)) score += 1;
  if (takeLabeled(line, ADDRESS_LABELS)) score += 2;
  if (score < 3) return 0;
  // 長い文章の中にたまたま県名が出てきただけ、というケースを下げる
  if (line.length > 60) score -= 2;
  return score;
}

/** 住所の行から、余計な前置き（ラベル・郵便番号など）を取り除く */
function cleanAddress(line: string): string {
  let value = takeLabeled(line, ADDRESS_LABELS) ?? line;
  value = value.replace(/〒?\s*[0-9０-９]{3}[-－‐ー]?[0-9０-９]{4}\s*/, "");
  // 都道府県より前にある文字（「場所は」など）を落とす
  const pref = value.match(PREF_PATTERN);
  if (pref && pref.index !== undefined) value = value.slice(pref.index);
  return value.trim();
}

/** 住所の次の行が「〇〇ビル 2F」のような建物名なら、住所にくっつける */
function looksLikeBuilding(line: string): boolean {
  return (
    line.length <= 25 &&
    /(ビル|[0-9０-９]+[FＦ階]|B[0-9０-９][FＦ]|地下|号室|マンション|ハイツ)/.test(line) &&
    !INFO_PATTERN.test(line)
  );
}

/** インスタのユーザー名（例: osaka_gourmet_hana）っぽい行 */
function looksLikeUsername(line: string): boolean {
  return /^[a-z0-9._]+$/.test(line) && /[._]/.test(line);
}

/** 説明文っぽい行（店名としては優先度を下げる） */
function looksLikeSentence(line: string): boolean {
  return line.length > 12 && /(な|で|が|を|は|の|に)[^\s]/.test(line);
}

function looksLikeName(line: string): boolean {
  if (line.length < 2 || line.length > 24) return false;
  if (looksLikeUsername(line)) return false;
  if (takeLabeled(line, NAME_LABELS)) return false;
  if (line.startsWith("#")) return false;
  if (/https?:\/\//.test(line)) return false;
  if (INFO_PATTERN.test(line)) return false;
  if (scoreAddress(line) > 0) return false;
  // 句読点で終わる文章や、値段・時刻は店名ではない
  if (/[。！？!?]$/.test(line)) return false;
  if (/[0-9０-９]+\s*(円|:|：)/.test(line)) return false;
  if (/駅/.test(line) && /(徒歩|分)/.test(line)) return false;
  return true;
}

export function parsePastedText(text: string): PasteParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => stripLeadingSymbols(l.trim()))
    .filter((l) => l && !isJunk(l));

  // ---- 住所：いちばん点数の高い行を選ぶ ----
  let addressIndex = -1;
  let bestScore = 0;
  lines.forEach((line, i) => {
    const score = scoreAddress(line);
    if (score > bestScore) {
      bestScore = score;
      addressIndex = i;
    }
  });
  let address = addressIndex >= 0 ? cleanAddress(lines[addressIndex]) : "";
  const next = lines[addressIndex + 1];
  const buildingIndex =
    address && next && looksLikeBuilding(next) ? addressIndex + 1 : -1;
  if (buildingIndex >= 0) address = `${address} ${next}`;

  // ---- 店名候補：確からしい順に集める ----
  const candidates: string[] = [];
  const add = (value: string | null | undefined) => {
    // 前後の括弧と、末尾の絵文字を取り除く
    const v = value
      ?.replace(/^[【「『]|[】」』]$/g, "")
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/u, "")
      .trim();
    if (v && v.length <= 30 && !candidates.includes(v)) candidates.push(v);
  };

  let confidentName = "";
  for (const line of lines) {
    const labeled = takeLabeled(line, NAME_LABELS);
    if (labeled) {
      const value = stripLeadingSymbols(labeled);
      if (!confidentName) confidentName = value;
      add(value);
    }
  }
  // 【喫茶さくら】のように括弧でくくられた言葉
  for (const line of lines) {
    for (const m of line.matchAll(/[【『「]([^】』」]{2,24})[】』」]/g)) {
      add(m[1]);
    }
  }
  // 住所の直前の行は店名であることが多い
  if (addressIndex > 0 && looksLikeName(lines[addressIndex - 1])) {
    add(lines[addressIndex - 1]);
  }
  // その他の短い行（説明文っぽい行は後回し）
  const rest = lines.filter(
    (line, i) => i !== buildingIndex && looksLikeName(line)
  );
  for (const line of rest.filter((l) => !looksLikeSentence(l))) add(line);
  for (const line of rest.filter(looksLikeSentence)) add(line);
  candidates.splice(8);

  // ---- ジャンル：文章全体からキーワードを探す（出てきた順） ----
  const found: { genre: string; at: number }[] = [];
  for (const [keyword, genre] of GENRE_KEYWORDS) {
    const at =
      typeof keyword === "string"
        ? text.indexOf(keyword)
        : (text.match(keyword)?.index ?? -1);
    if (at >= 0 && !found.some((f) => f.genre === genre)) {
      found.push({ genre, at });
    }
  }
  const genres = found
    .sort((a, b) => a.at - b.at)
    .slice(0, 6)
    .map((f) => f.genre);

  // ---- 公式サイトなどのURL（インスタ自身のURLは除く） ----
  const urls = text.match(/https?:\/\/[^\s　）)」]+/g) ?? [];
  const websiteUrl = urls.find((u) => !/instagram\.com|instagr\.am/i.test(u)) ?? "";
  const instagramUrl = normalizeInstagramUrl(text) ?? "";

  // ---- 営業時間・定休日など ----
  const infoLines = lines
    .filter((l) => INFO_PATTERN.test(l) && l.length <= 60)
    .slice(0, 5);

  return {
    address,
    nameCandidates: candidates,
    confidentName,
    genres,
    websiteUrl,
    instagramUrl,
    infoLines,
  };
}
