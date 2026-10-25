// Read-aloud through the browser's built-in speech synthesis. Used only for
// NovelVerse's own instructions and paraphrases, never for copyrighted text
// the teacher has not cleared.

export const speechAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, rate = 1) {
  if (!speechAvailable()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.lang = 'en-CA';
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (speechAvailable()) window.speechSynthesis.cancel();
}
