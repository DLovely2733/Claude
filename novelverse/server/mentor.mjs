// Optional AI Literary Mentor for the classroom server.
//
// Off unless the school turns it on: NOVELVERSE_AI_MENTOR=on plus Anthropic
// credentials (ANTHROPIC_API_KEY, or any credential the SDK resolves).
// Turning it on sends a student's draft sentence(s) and the unlocked chapter
// notes to the Anthropic API, so it needs school approval first.
//
// The mentor coaches with questions. Every reply is checked here before it
// reaches a student: quotations, page numbers and anything that reads like a
// finished answer are dropped, and the app falls back to the built-in mentor
// whenever nothing passes.

import Anthropic from '@anthropic-ai/sdk';

export const MENTOR_MODEL = 'claude-opus-5-5';
export const mentorEnabled = () => process.env.NOVELVERSE_AI_MENTOR === 'on';

let client = null;
const getClient = () => (client ??= new Anthropic());

const SYSTEM = `You are the Literary Mentor in NovelVerse, a Grade 9 English Language Arts novel-study app.
A student has written a draft answer. Coach their thinking; never do it for them.

Rules:
- Ask at most two short questions that push the student to find evidence, explain how evidence supports a claim, consider another reading, or qualify an absolute claim.
- You may begin with one short NOTICE naming something the student did well.
- Never write the student's answer, a model answer about this novel, or a thesis for them.
- Never quote the novel and never give page numbers. You only know the teacher's chapter notes below, which are paraphrases.
- Never mention events from chapters not listed in the notes. If the student refers to one, say it is not unlocked yet.
- If you cannot verify a detail the student mentions from the notes, ask them to check it in the book instead of confirming or denying it.
- Plain, warm language a 14-year-old understands. No more than 35 words per line.

Reply with one to three lines and nothing else. Start each line with NOTICE: or QUESTION: or GUARD: (GUARD is only for locked chapters).`;

const TASKS = {
  justify: 'justifying a decision with evidence',
  case: 'arguing a case about a character',
  explain: 'explaining the effect of an author’s choice',
  theme: 'writing a theme statement',
  reflect: 'reflecting on how their thinking changed',
  connection: 'explaining a relationship between characters',
};

/** Accept only coaching lines that follow the rules. Exported for tests. */
export function filterMentorReply(raw, unlocked = []) {
  const out = [];
  for (const line of String(raw).split(/\n+/)) {
    const m = line.trim().match(/^(NOTICE|QUESTION|GUARD):\s*(.+)$/i);
    if (!m) continue;
    const tone = m[1].toLowerCase() === 'notice' ? 'notice' : m[1].toLowerCase() === 'guard' ? 'guard' : 'question';
    const text = m[2].trim();
    if (text.split(/\s+/).length > 45) continue;
    if (/["“”][^"“”]{30,}["“”]/.test(text)) continue; // looks like a quotation
    if (/\b(p\.|pp\.|page)\s*\d+/i.test(text)) continue; // page numbers
    if (/\b(the answer is|you should write|here is (a|an|your) (answer|paragraph|thesis))\b/i.test(text)) continue;
    const chapters = [...text.matchAll(/\bchapter\s+(\d+)/gi)].map((x) => Number(x[1]));
    if (tone !== 'guard' && chapters.some((c) => !unlocked.includes(c))) continue;
    out.push({ tone, text });
    if (out.length === 3) break;
  }
  return out.some((m) => m.tone === 'question' || m.tone === 'guard') ? out : [];
}

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

export async function handleMentor(req, res) {
  const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
  if (!mentorEnabled()) return send(404, { error: 'AI mentor is not enabled on this server' });
  if (req.method !== 'POST') return send(405, { error: 'POST only' });
  if (rateLimited(req.socket.remoteAddress ?? '')) return send(429, { error: 'Too many requests' });

  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 24_000) return send(413, { error: 'Too large' });
  }
  let input;
  try { input = JSON.parse(body); } catch { return send(400, { error: 'Bad JSON' }); }
  const text = String(input.text ?? '').slice(0, 2000);
  const unlocked = Array.isArray(input.unlockedChapters) ? input.unlockedChapters.map(Number).filter(Number.isFinite) : [];
  const k = input.knowledge ?? {};
  const notes = [
    `Novel: ${String(k.title ?? '').slice(0, 120)}`,
    `Unlocked chapters: ${unlocked.join(', ') || 'none'}`,
    ...(Array.isArray(k.chapters) ? k.chapters.slice(0, 40).map((c) => `Chapter ${Number(c.number)} (${String(c.title ?? '').slice(0, 80)}): ${String(c.summary ?? '').slice(0, 500)}`) : []),
    ...(Array.isArray(k.evidence) ? k.evidence.slice(0, 40).map((e) => `Evidence, Ch. ${Number(e.chapter)} [${e.kind === 'interpretation' ? 'interpretation' : 'fact'}]: ${String(e.text ?? '').slice(0, 300)}`) : []),
  ].join('\n');
  const task = TASKS[input.task] ?? 'writing about the novel';
  const level = ['foundational', 'developing', 'sophisticated'].includes(input.thinkingLevel) ? input.thinkingLevel : 'developing';

  try {
    const response = await getClient().beta.messages.create({
      model: MENTOR_MODEL,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // A short coaching reply: low effort keeps it quick for a class of 30.
      output_config: { effort: 'low' },
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Teacher's chapter notes (paraphrased):\n${notes}\n\nThe student is ${task}. Thinking level: ${level}.\nStudent draft:\n<<<\n${text || '(empty)'}\n>>>`,
      }],
    });
    if (response.stop_reason === 'refusal') return send(502, { error: 'declined' });
    const raw = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const messages = filterMentorReply(raw, unlocked);
    if (!messages.length) return send(502, { error: 'no usable coaching' });
    return send(200, { messages, model: response.model });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return send(429, { error: 'AI mentor is busy' });
    if (err instanceof Anthropic.AuthenticationError) return send(503, { error: 'AI mentor credentials are not set up' });
    if (err instanceof Anthropic.APIError) return send(502, { error: `AI service error ${err.status ?? ''}`.trim() });
    return send(502, { error: 'AI service unreachable' });
  }
}
