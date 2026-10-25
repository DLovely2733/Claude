import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { href } from '../lib/router';
import { rangeLabel, placeholdersIn } from '../lib/generator';
import { toast } from '../components/toast';

export function MissionList() {
  const missions = useApp((s) => s.missions);
  const novels = useApp((s) => s.novels);
  const saveMission = useApp((s) => s.saveMission);
  const list = Object.values(missions).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header className="row between">
        <div>
          <span className="hud" style={{ color: 'var(--accent-2)' }}>Missions</span>
          <h1>Mission library</h1>
          <p className="text-2">Drafts are only visible to you. Publish a mission to launch it to students.</p>
        </div>
        <a className="btn primary" href={href('/teacher/build')}><Icon name="spark" size={18} /> Generate a mission</a>
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
    </div>
  );
}
