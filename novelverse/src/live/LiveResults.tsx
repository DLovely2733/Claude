import { motion } from 'motion/react';
import type { PublicState } from './logic';
import { CORNERS } from './logic';

const OBJ_LABEL = { speculation: 'Speculation', 'ignores-evidence': 'Ignores evidence', overgeneralization: 'Overgeneralization' } as const;

/** Anonymous class results, used on the projector and on student devices. */
export function LiveResults({ s, big = false }: { s: PublicState; big?: boolean }) {
  const label = (id: string) => s.options.find((o) => o.id === id)?.label ?? CORNERS.find((c) => c.id === id)?.label ?? id;
  return (
    <div className={`live-results ${big ? 'big' : ''}`}>
      {s.tallies && (
        <div className={`tally-rounds rounds-${s.tallies.length}`}>
          {s.tallies.map((t) => {
            const total = t.rows.reduce((a, r) => a + r.count, 0) || 1;
            return (
              <section key={t.round} aria-label={s.activity === 'courtroom' ? 'Verdict' : `Round ${t.round}`}>
                <h3 className="hud">{s.activity === 'courtroom' ? 'Verdict' : t.round === 1 ? 'First vote' : s.activity === 'showdown' ? 'Final vote' : 'After new evidence'}</h3>
                <ul className="live-bars">
                  {t.rows.map((r) => (
                    <li key={r.id}>
                      <span className="live-bar-label">{r.label}</span>
                      <span className="live-bar"><motion.span initial={{ width: 0 }} animate={{ width: `${(r.count / total) * 100}%` }} transition={{ duration: 0.8 }} /></span>
                      <span className="live-bar-count mono">{r.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      {s.shift && (
        <section className="shift" aria-label="How opinions shifted">
          <h3 className="hud accent">How the room moved</h3>
          <p><strong>{s.shift.stayed}</strong> kept their position.{' '}
            {s.shift.moved.length === 0 ? 'Nobody changed their mind.' : `${s.shift.moved.reduce((a, m) => a + m.count, 0)} changed their mind:`}</p>
          <ul className="shift-list">
            {s.shift.moved.map((m) => (
              <li key={`${m.from}>${m.to}`}><span className="chip">{label(m.from)}</span> <span aria-hidden="true">→</span><span className="sr-only">to</span> <span className="chip accent">{label(m.to)}</span> <span className="mono">×{m.count}</span></li>
            ))}
          </ul>
        </section>
      )}
      {s.wall && (
        <div className="wall">
          {s.wall.length === 0 && <p className="muted">No responses to show.</p>}
          {s.wall.map((w, i) => (
            <motion.blockquote key={w.id} className="wall-card" initial={{ opacity: 0, y: 10, rotate: (i % 3) - 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              {w.choice && <span className="chip tiny">{label(w.choice)}</span>}
              <p>{w.text}</p>
            </motion.blockquote>
          ))}
        </div>
      )}
      {s.arguments && s.arguments.length > 0 && (
        <div className="live-court">
          {['Prosecution', 'Defence'].map((team) => (
            <section key={team} className={`court-col ${team.toLowerCase()}`} aria-label={team}>
              <h3 className="hud">{team}</h3>
              {s.arguments!.filter((a) => a.team === team).map((a) => (
                <article key={a.id} className="court-arg">
                  {a.evidence && <p className="tiny muted" style={{ margin: 0 }}>Exhibit: {a.evidence}</p>}
                  <p style={{ margin: '0.2rem 0' }}>{a.text}</p>
                  {a.objections.map((o, i) => (
                    <p key={i} className={`court-obj ${o.ruling ?? ''}`}>
                      <strong>Objection: {OBJ_LABEL[o.type]}</strong> {o.text}
                      {o.ruling && <span className={`chip tiny ${o.ruling === 'sustained' ? 'good' : 'warn'}`}>{o.ruling}</span>}
                    </p>
                  ))}
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
