/** True when NovelVerse runs inside another page's frame (e.g. a shared preview). */
export function isEmbedded(): boolean {
  try { return window.self !== window.top; } catch { return true; }
}
