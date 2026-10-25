import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { aiMentor, aiMentorAvailable } from '../lib/aiMentor';
import { useApp } from '../state/store';
import { analyzeReasoning, shortNames } from '../lib/reasoning';
import { mentorRespond, type MentorContext, type MentorMessage } from '../lib/mentor';
import { unlockedChapters } from '../lib/knowledge';
import type { Novel, ThinkingLevel } from '../data/types';
import { Icon } from './Icon';
import { play } from '../lib/sound';

const TONE_LABEL: Record<MentorMessage['tone'], string> = {
  question: 'Question',
  frame: 'Sentence starter',
  model: 'Worked model (different story)',
  notice: 'What I notice',
  guard: 'Spoiler guard',
};

/**
 * Literary Mentor button + panel. Coaches the text the student has written
 * so far. Each press goes one level deeper: question, then a sentence
 * starter, then a model from a different story.
 */
export function Mentor({ text, novel, task, thinkingLevel, evidenceCount, onUse }: {
  text: string;
  novel: Novel;
  task: MentorContext['task'];
  thinkingLevel: ThinkingLevel;
  evidenceCount?: number;
  onUse?: () => void;
}) {
  const enabled = useApp((s) => s.settings.mentor);
  const [depth, setDepth] = useState(0);
  const [msgs, setMsgs] = useState<MentorMessage[] | null>(null);
  const [ai, setAi] = useState(false);
  const [source, setSource] = useState<'ai' | 'local' | null>(null);
  const [thinking, setThinking] = useState(false);
  useEffect(() => { aiMentorAvailable().then(setAi); }, []);
  if (!enabled) return null;

  const ask = async () => {
    const ctx = { task, thinkingLevel, evidenceCount, unlockedChapters: unlockedChapters(novel), depth };
    const local = () => mentorRespond(text, analyzeReasoning(text, shortNames(novel.characters.map((c) => c.name))), ctx);
    setDepth(depth + 1);
    play('open');
    onUse?.();
    // The AI mentor asks the first question. Sentence starters and worked
    // models stay with the built-in mentor, which never sees the network.
    if (ai && depth === 0 && text.trim()) {
      setThinking(true);
      try {
        setMsgs(await aiMentor(novel).respond(text, ctx));
        setSource('ai');
      } catch {
        setMsgs(local());
        setSource('local');
      } finally {
        setThinking(false);
      }
      return;
    }
    setMsgs(local());
    setSource('local');
  };

  return (
    <div className="mentor">
      <button type="button" className="btn ghost small" onClick={ask} disabled={thinking}>
        <Icon name="chat" size={18} /> {thinking ? 'The mentor is reading…' : msgs ? 'Ask the mentor again' : 'Ask the Literary Mentor'}
      </button>
      <AnimatePresence>
        {msgs && (
          <motion.div className="mentor-panel" role="status" aria-live="polite"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="row between">
              <span className="hud accent">Literary Mentor{source === 'ai' ? ' · AI' : ''}</span>
              <button type="button" className="btn quiet small" onClick={() => setMsgs(null)} aria-label="Close mentor">
                <Icon name="close" size={16} />
              </button>
            </div>
            {msgs.map((m, i) => (
              <div key={i} className={`mentor-msg tone-${m.tone}`}>
                <span className="hud">{TONE_LABEL[m.tone]}</span>
                <p style={{ margin: 0 }}>{m.text}</p>
              </div>
            ))}
            <p className="tiny muted" style={{ margin: 0 }}>
              The mentor asks questions. It only knows your teacher’s notes for unlocked chapters, and it never writes your answer.{source === 'ai' ? ' This reply came from an AI model your school enabled; check anything it says against the book.' : ''}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
