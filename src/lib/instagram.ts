/**
 * 文字列の中からインスタの投稿・リールのURLを見つけ、きれいな形に整える。
 *
 * 「リンクをコピー」で取れるURLには ?igsh=... のような追跡用の文字が付くので取り除く。
 * インスタ以外のURL（javascript: など危険なものを含む）は受け付けず null を返す。
 */
export function normalizeInstagramUrl(input: string): string | null {
  const match = input.match(/https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/[^\s　]+/i);
  if (!match) return null;

  let url: URL;
  try {
    url = new URL(match[0]);
  } catch {
    return null;
  }

  // 投稿・リールのURLは「/p/ID/」「/reel/ID/」の形にそろえる
  const post = url.pathname.match(/^\/(?:[^/]+\/)?(p|reels?|tv)\/([A-Za-z0-9_-]+)/);
  if (post) {
    const kind = post[1] === "reels" ? "reel" : post[1];
    return `https://www.instagram.com/${kind}/${post[2]}/`;
  }

  // アカウントページなど、それ以外のインスタのURLは追跡用の文字だけ落とす
  return `https://www.instagram.com${url.pathname}`;
}
