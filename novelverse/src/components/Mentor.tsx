import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
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
  if (!enabled) return null;

  const ask = () => {
    const names = shortNames(novel.characters.map((c) => c.name));
    const signals = analyzeReasoning(text, names);
    setMsgs(mentorRespond(text, signals, { task, thinkingLevel, evidenceCount, unlockedChapters: unlockedChapters(novel), depth }));
    setDepth(depth + 1);
    play('open');
    onUse?.();
  };

  return (
    <div className="mentor">
      <button type="button" className="btn ghost small" onClick={ask}>
        <Icon name="chat" size={18} /> {msgs ? 'Ask the mentor again' : 'Ask the Literary Mentor'}
      </button>
      <AnimatePresence>
        {msgs && (
          <motion.div className="mentor-panel" role="status" aria-live="polite"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="row between">
              <span className="hud accent">Literary Mentor</span>
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
              The mentor asks questions. It does not know anything beyond your teacher’s chapter notes, and it never writes your answer.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
