// "N min read" for any article: about 220 words a minute, plus a little time per photo.
// Image and link addresses aren't read, so they don't count as words.
export function readingMinutes(entry: { body?: string }): number {
  const body = entry.body ?? '';
  const images = (body.match(/!\[[^\]]*\]\([^)]*\)/g) ?? []).length;
  const text = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // photos
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links: keep the words, drop the address
    .replace(/<[^>]+>/g, ' '); // any HTML tags
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.round(words / 220 + images * 0.15));
}
