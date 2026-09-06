/**
 * 住所から「大まかなエリア名」の候補を推測する。
 * 例: 「兵庫県西宮市…」→「西宮」／「三重県四日市市…」→「四日市」
 *
 * あくまで入力の手助けなので、外れた場合はユーザーが手で直せる前提。
 */
export function guessAreaFromAddress(address: string): string {
  const value = address.trim();
  if (!value) return "";

  // 東京23区と北海道はまとめて扱う
  if (value.startsWith("東京都")) return "東京";
  if (value.startsWith("北海道")) return "北海道";

  // 都道府県名を取り除く
  let rest = value.replace(/^.{2,3}?[都道府県]/, "");
  // 「〇〇郡」を取り除く（例: 国頭郡恩納村 → 恩納村）
  rest = rest.replace(/^.{1,4}?郡/, "");

  const matched = rest.match(/^(.{1,6}?)([市区町村])/);
  if (matched) {
    const [whole, name, suffix] = matched;
    // 「四日市」＋「市」のように、地名自体が市区町村の字を含む場合に対応
    if (rest.slice(whole.length).startsWith(suffix)) {
      return name + suffix;
    }
    return name;
  }

  // 市区町村が読み取れない場合は都道府県名から「都道府県」を落とす
  const pref = value.match(/^(.{2,3}?)[都道府県]/);
  return pref?.[1] ?? "";
}

/** 登録済みのお店から、実際に使われているエリア名を重複なく取り出す */
export function collectAreas(items: { area: string | null }[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const area = item.area?.trim();
    if (area) set.add(area);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"));
}
