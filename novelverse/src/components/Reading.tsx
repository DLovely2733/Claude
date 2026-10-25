import type { ReactNode } from 'react';
import { useApp } from '../state/store';
import type { Mission, Verification, VocabTerm } from '../data/types';
import { speak, speechAvailable } from '../lib/speech';
import { Icon } from './Icon';
import { useState } from 'react';

// Reading supports change how ideas are worded, never which ideas students
// get to think about. Plain language and short instructions swap in
// rewritten text; the task and its thinking demand stay the same.

export function useReading(mission?: Mission) {
  const s = useApp((st) => st.settings);
  const plain = s.plainLanguage || mission?.readingLevel === 'supported';
  return {
    plain,
    short: s.shortInstructions || plain,
    pick: (full: string, simple?: string) => (plain && simple ? simple : full),
    instructions: (full: string, short?: string) => ((s.shortInstructions || plain) && short ? short : full),
    readAloud: s.readAloud,
    frames: s.sentenceFrames || mission?.thinkingLevel === 'foundational',
  };
}

export function ReadAloud({ text, label = 'Read aloud' }: { text: string; label?: string }) {
  const on = useApp((s) => s.settings.readAloud);
  if (!on || !speechAvailable()) return null;
  return (
    <button type="button" className="btn quiet small read-btn" onClick={() => speak(text)} aria-label={`${label}: ${text.slice(0, 60)}`}>
      <Icon name="speak" size={18} /> <span>Listen</span>
    </button>
  );
}

export function Readable({ children, text, as = 'p', className }: { children?: ReactNode; text: string; as?: 'p' | 'div'; className?: string }) {
  const Tag = as;
  return (
    <div className="row top" style={{ gap: '0.4rem', flexWrap: 'nowrap' }}>
      <Tag className={`grow ${className ?? ''}`} style={{ margin: 0 }}>{children ?? text}</Tag>
      <ReadAloud text={text} />
    </div>
  );
}

export function VerifyBadge({ v, teacher = false }: { v: Verification; teacher?: boolean }) {
  if (v === 'needs-check') {
    return (
      <span className="verify" title="Drafted by NovelVerse. The teacher has not checked this against the book yet.">
        {teacher ? 'Needs your check' : 'Teacher check pending'}
      </span>
    );
  }
  if (!teacher) return null;
  return <span className="verify ok">{v === 'teacher-added' ? 'Teacher added' : 'Verified'}</span>;
}

export function VocabChip({ term }: { term: VocabTerm }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="vocab">
      <button type="button" className="vocab-term" aria-expanded={open} onClick={() => setOpen(!open)}>
        {term.term}
      </button>
      {open && (
        <span role="note" className="vocab-pop">
          <strong>{term.term}</strong> <span className="chip tiny">{term.kind === 'literary' ? 'literary term' : 'from the novel'}</span>
          <br />
          {term.definition}
        </span>
      )}
    </span>
  );
}
