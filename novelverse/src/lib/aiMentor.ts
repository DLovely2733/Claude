import type { Novel } from '../data/types';
import type { MentorContext, MentorMessage, MentorProvider } from './mentor';
import { unlockedChapters, visibleEvidence } from './knowledge';
import { serverInfo } from '../live/transport';

// Client for the optional server-side AI mentor (server/mentor.mjs). Only
// knowledge from unlocked chapters is ever sent, so the AI cannot spoil
// chapters the class has not reached.

export const aiMentorAvailable = () => serverInfo().then((i) => i.mentor);

export function aiMentor(novel: Novel): MentorProvider {
  return {
    async respond(text: string, ctx: MentorContext): Promise<MentorMessage[]> {
      const open = new Set(unlockedChapters(novel));
      const body = {
        text,
        task: ctx.task,
        thinkingLevel: ctx.thinkingLevel,
        unlockedChapters: [...open],
        knowledge: {
          title: novel.title,
          chapters: novel.chapters.filter((c) => open.has(c.number)).map((c) => ({ number: c.number, title: c.title, summary: c.summary })),
          evidence: visibleEvidence(novel).map((e) => ({ chapter: e.chapter, kind: e.kind, text: e.text })),
        },
      };
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20_000);
      try {
        const r = await fetch('api/mentor', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
        if (!r.ok) throw new Error(`mentor ${r.status}`);
        const j = (await r.json()) as { messages?: MentorMessage[] };
        if (!j.messages?.length) throw new Error('empty');
        return j.messages;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
