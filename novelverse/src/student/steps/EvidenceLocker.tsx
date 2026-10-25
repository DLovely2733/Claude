import type { Evidence, Novel } from '../../data/types';
import { useReading, ReadAloud, VerifyBadge } from '../../components/Reading';
import { Icon } from '../../components/Icon';
import { play } from '../../lib/sound';

export function EvidenceLocker({ novel, evidence, selected, onToggle, max }: {
  novel: Novel; evidence: Evidence[]; selected: string[]; onToggle: (id: string) => void; max?: number;
}) {
  const r = useReading();
  void novel;
  return (
    <ul className="locker" aria-label="Evidence locker">
      {evidence.map((e) => {
        const on = selected.includes(e.id);
        const text = r.pick(e.text, e.plain);
        const full = !on && max !== undefined && selected.length >= max;
        return (
          <li key={e.id}>
            <div className={`locker-card ${on ? 'on' : ''}`}>
              <button type="button" className="locker-toggle" aria-pressed={on} disabled={full}
                onClick={() => { onToggle(e.id); play('pin'); }}>
                <span className="locker-check" aria-hidden="true">{on ? <Icon name="check" size={16} /> : <Icon name="plus" size={16} />}</span>
                <span className="grow">
                  <span className="row" style={{ gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <span className="hud">Ch. {e.chapter}</span>
                    <span className={`chip tiny ${e.kind === 'fact' ? '' : 'amber'}`}>{e.kind === 'fact' ? 'Fact' : 'Interpretation'}</span>
                    <VerifyBadge v={e.verification} />
                  </span>
                  <span>{text}</span>
                  {e.quote && <span className="locker-quote">“{e.quote.text}” <span className="tiny muted">({e.quote.edition}, p. {e.quote.page})</span></span>}
                </span>
              </button>
              <ReadAloud text={text} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
