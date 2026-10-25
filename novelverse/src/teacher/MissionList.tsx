import { useState } from 'react';
import { ask } from '../components/Dialog';
import { useApp } from '../state/store';
import { navigate } from '../lib/router';
import { uid } from '../lib/id';
import { Icon } from '../components/Icon';
import { href } from '../lib/router';
import { rangeLabel, placeholdersIn } from '../lib/generator';
import { toast } from '../components/toast';

export function MissionList() {
  const missions = useApp((s) => s.missions);
  const novels = useApp((s) => s.novels);
  const saveMission = useApp((s) => s.saveMission);
  const templates = useApp((s) => s.templates);
  const deleteTemplate = useApp((s) => s.deleteTemplate);
  const [blankNovel, setBlankNovel] = useState(Object.keys(novels)[0] ?? '');
  const newBlank = () => {
    const n = novels[blankNovel];
    if (!n) return;
    const id = uid('m');
    saveMission({ id, novelId: n.id, title: 'Untitled mission', codename: 'NEW', summary: '', chapterNumbers: n.chapters.filter((c) => c.unlocked).slice(-1).map((c) => c.number),
      outcomes: [], readingLevel: 'standard', thinkingLevel: 'developing', grouping: 'independent', duration: 45, status: 'draft', steps: [], createdBy: 'teacher', updatedAt: Date.now() });
    navigate(`/teacher/mission/${id}`);
  };
  const list = Object.values(missions).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header className="row between">
        <div>
          <span className="hud" style={{ color: 'var(--accent-2)' }}>Missions</span>
          <h1>Mission library</h1>
          <p className="text-2">Drafts are only visible to you. Publish a mission to launch it to students.</p>
        </div>
        <div className="row">
          <a className="btn primary" href={href('/teacher/build')}><Icon name="spark" size={18} /> Generate a mission</a>
          <label className="row small">
            <span className="sr-only">Novel for a blank mission</span>
            <select className="select" style={{ width: 'auto' }} value={blankNovel} onChange={(e) => setBlankNovel(e.target.value)}>
              {Object.values(novels).map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
          </label>
          <button className="btn ghost" onClick={newBlank} disabled={!blankNovel}><Icon name="plus" size={18} /> Blank mission</button>
        </div>
      </header>
      <div className="table-wrap panel" style={{ padding: 0, marginTop: '1.5rem' }}>
        <table className="table">
          <thead><tr><th scope="col">Mission</th><th scope="col">Novel</th><th scope="col">Chapters</th><th scope="col">Length</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {list.map((m) => {
              const gaps = placeholdersIn(m.steps).length;
              return (
                <tr key={m.id}>
                  <td><a href={href(`/teacher/mission/${m.id}`)}><strong>{m.title}</strong></a><br /><span className="tiny muted">{m.steps.length} rooms · {m.createdBy === 'generator' ? 'generated draft' : m.createdBy === 'demo' ? 'demo' : 'teacher-built'}</span></td>
                  <td>{novels[m.novelId]?.title ?? '—'}</td>
                  <td>{rangeLabel(m.chapterNumbers)}</td>
                  <td>{m.duration} min</td>
                  <td>
                    {m.status === 'published' ? <span className="chip good">Live</span> : <span className="chip">Draft</span>}
                    {gaps > 0 && <span className="verify" style={{ marginLeft: 4 }}>{gaps} to fill</span>}
                  </td>
                  <td>
                    <div className="row" style={{ gap: '0.25rem', flexWrap: 'nowrap' }}>
                      <a className="btn quiet small" href={href(`/teacher/preview/${m.id}`)}><Icon name="eye" size={16} /> Preview</a>
                      <a className="btn quiet small" href={href(`/teacher/print/${m.id}`)}><Icon name="print" size={16} /> Print</a>
                      {m.status === 'published' && <button className="btn quiet small" onClick={() => { saveMission({ ...m, status: 'draft' }); toast('Mission taken offline'); }}>Unpublish</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <section style={{ marginTop: '2.5rem' }} aria-labelledby="tpl-h">
        <h2 id="tpl-h">Templates</h2>
        <p className="text-2">Reusable mission shapes. Apply one to any novel and chapters; NovelVerse fills it from that novel’s knowledge base.</p>
        <div className="template-grid">
          {templates.map((t) => (
            <article key={t.id} className="template-card">
              <span className="row between"><strong>{t.name}</strong><span className="chip tiny">{t.duration} min</span></span>
              <span className="small text-2">{t.description}</span>
              <span className="tiny muted">{t.engines.length} rooms · {t.grouping} · outcomes {t.outcomeCodes.join(', ') || '—'}</span>
              <span className="row" style={{ gap: '0.3rem' }}>
                <a className="btn small" href={href(`/teacher/build/${Object.keys(novels)[0] ?? ''}/${t.id}`)}>Use</a>
                {!t.builtIn && <button className="btn quiet small" onClick={() => ask({ title: `Delete template “${t.name}”?`, confirmLabel: 'Delete', danger: true }).then((ok) => ok && deleteTemplate(t.id))}><Icon name="trash" size={14} /> Delete</button>}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
