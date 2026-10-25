import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { href, navigate } from '../lib/router';
import { uid } from '../lib/id';
import { readingFrontier, unverifiedCount } from '../lib/knowledge';
import { downloadFile } from '../lib/download';
import { ListEditor, FieldInput, StringList, type FieldSpec } from './ListEditor';
import { SKINS, parseChapterNotes } from './NovelLibrary';
import type { Novel, Evidence } from '../data/types';
import { useState } from 'react';
import { toast } from '../components/toast';
import { FileText } from '../components/FileText';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'chapters', label: 'Chapters & spoilers' },
  { id: 'characters', label: 'Characters' },
  { id: 'events', label: 'Events' },
  { id: 'evidence', label: 'Evidence bank' },
  { id: 'themes', label: 'Themes' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'vocab', label: 'Vocabulary' },
];

const ch = (label = 'Chapter'): FieldSpec => ({ key: 'chapter', label, kind: 'number' });

export function NovelEditor({ novelId, tab = 'overview' }: { novelId: string; tab?: string }) {
  const novel = useApp((s) => s.novels[novelId]);
  const saveNovel = useApp((s) => s.saveNovel);
  if (!novel) return <div className="wrap"><div className="empty" style={{ marginTop: '2rem' }}>Novel not found. <a href={href('/teacher/novels')}>Back to novels</a></div></div>;
  const set = (p: Partial<Novel>) => saveNovel({ ...novel, ...p });
  const charOpts = novel.characters.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <a className="btn quiet small" href={href('/teacher/novels')}><Icon name="back" size={16} /> Novels</a>
      <header className="row between" style={{ marginTop: '0.5rem' }}>
        <div>
          <span className="hud accent">Knowledge base · {unverifiedCount(novel)} items need your check</span>
          <h1 className="serif" style={{ marginBottom: 0 }}>{novel.title}</h1>
          <p className="text-2">{novel.author}</p>
        </div>
        <a className="btn primary" href={href(`/teacher/build/${novel.id}`)}><Icon name="spark" size={18} /> Generate a mission</a>
      </header>

      <div className="tabs" role="tablist" aria-label="Knowledge base sections">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => navigate(`/teacher/novel/${novel.id}/${t.id}`)}>{t.label}</button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'overview' && <Overview novel={novel} set={set} />}
        {tab === 'chapters' && <Chapters novel={novel} set={set} />}
        {tab === 'characters' && (
          <ListEditor title="Characters" novel={novel} items={novel.characters} onChange={(characters) => set({ characters })}
            intro="Characters stay hidden from students until the chapter they first matter in is unlocked."
            summary={(c) => `${c.name} · ${c.role}`}
            make={() => ({ id: uid('char'), name: '', role: '', description: '', plain: '', firstChapter: 1, verification: 'teacher-added' })}
            fields={[
              { key: 'name', label: 'Name', kind: 'text' }, { key: 'role', label: 'Role', kind: 'text' },
              { key: 'firstChapter', label: 'First chapter', kind: 'number' },
              { key: 'description', label: 'Description', kind: 'long' }, { key: 'plain', label: 'Plain-language description', kind: 'long' },
            ]} />
        )}
        {tab === 'events' && (
          <ListEditor title="Key events" novel={novel} items={novel.events} onChange={(events) => set({ events })}
            intro="Events power timeline locks and dilemmas. Write them in your own words."
            summary={(e) => `Ch. ${e.chapter} · ${e.text}`}
            make={() => ({ id: uid('ev'), chapter: readingFrontier(novel) || 1, kind: 'event' as const, text: '', plain: '', characters: [], verification: 'teacher-added' as const })}
            fields={[
              ch(), { key: 'kind', label: 'Type', kind: 'select', options: [{ value: 'event', label: 'Event' }, { value: 'turning-point', label: 'Turning point' }, { value: 'conflict', label: 'Conflict' }] },
              { key: 'text', label: 'What happens', kind: 'long' }, { key: 'plain', label: 'Plain-language version', kind: 'long' },
              { key: 'characters', label: 'Characters involved', kind: 'characters' },
            ]} />
        )}
        {tab === 'evidence' && <EvidenceTab novel={novel} set={set} />}
        {tab === 'themes' && (
          <ListEditor title="Themes" novel={novel} items={novel.themes} onChange={(themes) => set({ themes })}
            intro="The ladder goes from a simple statement to a sophisticated one. Generated theme locks use it; students never see the full ladder."
            summary={(t) => `${t.topic}${t.question ? ` · ${t.question}` : ''}`}
            make={() => ({ id: uid('theme'), topic: '', question: '', ladder: [] })}
            fields={[
              { key: 'topic', label: 'Topic', kind: 'text' }, { key: 'question', label: 'Big question', kind: 'text' },
              { key: 'ladder', label: 'Theme ladder (simple → sophisticated)', kind: 'strings' },
            ]} />
        )}
        {tab === 'relationships' && (
          <ListEditor title="Relationships" novel={novel} items={novel.relationships} onChange={(relationships) => set({ relationships })}
            intro="Your reference map. Students compare their own map with it after building theirs."
            summary={(r) => `${novel.characters.find((c) => c.id === r.from)?.name ?? '?'} → ${novel.characters.find((c) => c.id === r.to)?.name ?? '?'} · ${r.type} · Ch. ${r.chapter}`}
            make={() => ({ id: uid('rel'), from: '', to: '', type: 'alliance' as const, chapter: 1, note: '', verification: 'teacher-added' as const })}
            fields={[
              { key: 'from', label: 'From', kind: 'select', options: [{ value: '', label: 'Choose…' }, ...charOpts] },
              { key: 'to', label: 'To', kind: 'select', options: [{ value: '', label: 'Choose…' }, ...charOpts] },
              { key: 'type', label: 'Type', kind: 'select', options: ['alliance', 'conflict', 'mentor', 'manipulation', 'family', 'rivalry'].map((v) => ({ value: v, label: v })) },
              ch('By chapter'), { key: 'note', label: 'Note', kind: 'long' },
            ]} />
        )}
        {tab === 'techniques' && (
          <ListEditor title="Literary techniques" novel={novel} items={novel.techniques} onChange={(techniques) => set({ techniques })}
            summary={(t) => `${t.name} · Ch. ${t.chapter}`}
            make={() => ({ id: uid('tech'), name: '', description: '', example: '', chapter: 1, verification: 'teacher-added' })}
            fields={[
              { key: 'name', label: 'Technique', kind: 'text' }, ch(),
              { key: 'description', label: 'How the author uses it', kind: 'long' }, { key: 'example', label: 'Effect on readers', kind: 'long' },
            ]} />
        )}
        {tab === 'vocab' && (
          <ListEditor title="Vocabulary" novel={novel} items={novel.vocab} onChange={(vocab) => set({ vocab })}
            summary={(v) => `${v.term} · ${v.kind}`}
            make={() => ({ id: uid('v'), term: '', definition: '', kind: 'story' as const })}
            fields={[
              { key: 'term', label: 'Term', kind: 'text' },
              { key: 'kind', label: 'Kind', kind: 'select', options: [{ value: 'story', label: 'From the novel' }, { value: 'literary', label: 'Literary term' }] },
              { key: 'definition', label: 'Student-friendly definition', kind: 'long' },
            ]} />
        )}
      </div>
    </div>
  );
}

function Overview({ novel, set }: { novel: Novel; set: (p: Partial<Novel>) => void }) {
  const deleteNovel = useApp((s) => s.deleteNovel);
  const saveNovel = useApp((s) => s.saveNovel);
  const [importing, setImporting] = useState(false);
  return (
    <div className="grid cols-2">
      <section className="panel stack">
        <FieldInput spec={{ key: 'title', label: 'Title', kind: 'text' }} value={novel.title} novel={novel} onChange={(v) => set({ title: String(v) })} />
        <FieldInput spec={{ key: 'author', label: 'Author', kind: 'text' }} value={novel.author} novel={novel} onChange={(v) => set({ author: String(v) })} />
        <FieldInput spec={{ key: 'tagline', label: 'Tagline (shown on the student story map)', kind: 'text' }} value={novel.tagline} novel={novel} onChange={(v) => set({ tagline: String(v) })} />
        <FieldInput spec={{ key: 'setting', label: 'Setting and background', kind: 'long' }} value={novel.setting} novel={novel} onChange={(v) => set({ setting: String(v) })} />
        <div className="field">
          <span className="label">Content notes for students</span>
          <StringList value={novel.contentNotes} onChange={(contentNotes) => set({ contentNotes })} />
        </div>
      </section>
      <section className="stack">
        <div className="panel">
          <h2 className="hud">Visual world</h2>
          <div className="skin-grid">
            {SKINS.map((s) => (
              <button key={s.id} type="button" className={`skin-swatch ${novel.skin === s.id ? 'on' : ''}`} data-skin={s.id} aria-pressed={novel.skin === s.id} onClick={() => set({ skin: s.id })}>
                <span className="skin-preview" aria-hidden="true"><span /><span /><span /></span>
                <strong>{s.genre}</strong><span className="tiny">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2 className="hud">Copyright & sources</h2>
          <p className="small">NovelVerse stores your notes, summaries and short excerpts you are permitted to use. It never reproduces whole chapters. Page numbers are always tied to an edition, because they differ between printings.</p>
          <div className="row">
            <button className="btn ghost small" onClick={() => downloadFile(`${novel.id}.json`, JSON.stringify(novel, null, 2))}><Icon name="download" size={16} /> Export knowledge base</button>
            <button className="btn ghost small" onClick={() => setImporting(!importing)}>Import JSON</button>
            <FileText label="Import from file" accept=".json,application/json" onText={(t) => {
              try {
                const data = JSON.parse(t) as Novel;
                if (!data.chapters || !data.title) throw new Error('missing fields');
                if (confirm(`Replace this knowledge base with “${data.title}” from the file?`)) { saveNovel({ ...data, id: novel.id }); toast('Knowledge base imported'); }
              } catch { toast('That file is not a NovelVerse knowledge base'); }
            }} />
          </div>
          {importing && (
            <div className="field" style={{ marginTop: '0.75rem' }}>
              <label htmlFor="imp">Paste an exported knowledge base. It replaces this one.</label>
              <textarea id="imp" className="textarea" onBlur={(e) => {
                try {
                  const data = JSON.parse(e.target.value) as Novel;
                  if (!data.chapters || !data.title) throw new Error('missing fields');
                  saveNovel({ ...data, id: novel.id });
                  toast('Knowledge base imported');
                  setImporting(false);
                } catch { toast('That is not a NovelVerse knowledge base'); }
              }} />
            </div>
          )}
        </div>
        {novel.createdBy !== 'demo' && (
          <button className="btn danger small" style={{ alignSelf: 'flex-start' }} onClick={() => {
            if (confirm(`Delete ${novel.title} and its missions?`)) { deleteNovel(novel.id); navigate('/teacher/novels'); }
          }}><Icon name="trash" size={16} /> Delete novel</button>
        )}
      </section>
    </div>
  );
}

function Chapters({ novel, set }: { novel: Novel; set: (p: Partial<Novel>) => void }) {
  const [notes, setNotes] = useState('');
  const frontier = readingFrontier(novel);
  const unlockTo = (n: number) => set({ chapters: novel.chapters.map((c) => ({ ...c, unlocked: c.number <= n })) });
  const patch = (id: string, p: Partial<Novel['chapters'][number]>) => set({ chapters: novel.chapters.map((c) => (c.id === id ? { ...c, ...p } : c)) });

  return (
    <div className="stack">
      <section className="panel">
        <div className="row between">
          <div>
            <h2 className="hud accent" style={{ margin: 0 }}>Spoiler control</h2>
            <p className="small" style={{ margin: '0.3rem 0 0' }}>Students and the Literary Mentor only see knowledge from unlocked chapters. Current frontier: <strong>Chapter {frontier || 'none'}</strong>.</p>
          </div>
          <label className="row small">
            Unlock up to chapter
            <select className="select" style={{ width: 'auto' }} value={frontier} onChange={(e) => unlockTo(Number(e.target.value))}>
              <option value={0}>None</option>
              {novel.chapters.map((c) => <option key={c.id} value={c.number}>{c.number}</option>)}
            </select>
          </label>
        </div>
      </section>

      <div className="table-wrap panel" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th scope="col">#</th><th scope="col">Title</th><th scope="col">Summary (your words)</th><th scope="col">Unlocked</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {novel.chapters.map((c) => (
              <tr key={c.id}>
                <td className="mono">{c.number}</td>
                <td><input className="input" aria-label={`Chapter ${c.number} title`} value={c.title} onChange={(e) => patch(c.id, { title: e.target.value })} /></td>
                <td style={{ minWidth: 280 }}>
                  <textarea className="textarea" style={{ minHeight: 64 }} aria-label={`Chapter ${c.number} summary`} value={c.summary} onChange={(e) => patch(c.id, { summary: e.target.value })} />
                  <textarea className="textarea" style={{ minHeight: 48, marginTop: 4 }} aria-label={`Chapter ${c.number} plain-language summary`} placeholder="Plain-language version (optional)" value={c.plain ?? ''} onChange={(e) => patch(c.id, { plain: e.target.value })} />
                </td>
                <td><input type="checkbox" className="switch" role="switch" aria-label={`Unlock chapter ${c.number}`} checked={c.unlocked} onChange={(e) => patch(c.id, { unlocked: e.target.checked })} /></td>
                <td>
                  {c.verification === 'needs-check'
                    ? <button className="btn small" onClick={() => patch(c.id, { verification: 'teacher-verified' })}>Mark checked</button>
                    : <span className="verify ok">{c.verification === 'teacher-added' ? 'Teacher added' : 'Verified'}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="panel">
        <h2 className="hud">Paste chapter notes</h2>
        <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Chapter notes" placeholder={'3 | Title | Summary in your own words\nChapter 4: Title - Summary'} />
        <div className="row end" style={{ marginTop: '0.5rem' }}>
          <FileText label="Load notes from a text file" onText={(t) => setNotes(t)} />
          <button className="btn small" disabled={!notes.trim()} onClick={() => {
            const parsed = parseChapterNotes(notes);
            let chapters = [...novel.chapters];
            for (const p of parsed) {
              const existing = chapters.find((c) => c.number === p.number);
              chapters = existing
                ? chapters.map((c) => (c === existing ? { ...c, title: p.title, summary: p.summary || c.summary, verification: 'teacher-added' as const } : c))
                : [...chapters, { id: uid('ch'), number: p.number, title: p.title, summary: p.summary, unlocked: false, verification: 'teacher-added' as const }];
            }
            set({ chapters: chapters.sort((a, b) => a.number - b.number) });
            toast(`${parsed.length} chapter notes applied`);
            setNotes('');
          }}>Apply notes</button>
        </div>
      </section>
    </div>
  );
}

function EvidenceTab({ novel, set }: { novel: Novel; set: (p: Partial<Novel>) => void }) {
  const patchQuote = (id: string, q: Evidence['quote']) => set({ evidence: novel.evidence.map((e) => (e.id === id ? { ...e, quote: q } : e)) });
  return (
    <div className="stack">
      <ListEditor title="Evidence bank" novel={novel} items={novel.evidence} onChange={(evidence) => set({ evidence })}
        intro="Facts are things that happen; interpretations are readings of them. Students sort them on the evidence board, so label each one carefully. NovelVerse never writes quotations; add short ones yourself below, with the edition and page."
        summary={(e) => `Ch. ${e.chapter} · ${e.kind === 'fact' ? 'Fact' : 'Interpretation'} · ${e.text}`}
        make={() => ({ id: uid('ec'), chapter: readingFrontier(novel) || 1, kind: 'fact' as const, text: '', plain: '', characters: [], themes: [], verification: 'teacher-added' as const })}
        fields={[
          ch(), { key: 'kind', label: 'Kind', kind: 'select', options: [{ value: 'fact', label: 'Fact (plot detail)' }, { value: 'interpretation', label: 'Interpretation' }] },
          { key: 'text', label: 'Evidence (paraphrase)', kind: 'long' }, { key: 'plain', label: 'Plain-language version', kind: 'long' },
          { key: 'characters', label: 'Characters', kind: 'characters' }, { key: 'themes', label: 'Themes', kind: 'themes' },
        ]} />
      <section className="panel">
        <h2 className="hud">Quotations from your edition</h2>
        <p className="small muted">Optional. Add a short quotation to any evidence card. Students see it with its edition and page.</p>
        <ul className="le-list">
          {novel.evidence.map((e) => (
            <li key={e.id} className="le-item">
              <details>
                <summary className="le-toggle" style={{ padding: '0.6rem 0.8rem' }}>Ch. {e.chapter} · {e.text.slice(0, 80)}{e.quote ? ' · has quotation' : ''}</summary>
                <div className="le-body grid cols-3">
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor={`q-${e.id}`}>Quotation (exact words from your copy)</label>
                    <textarea id={`q-${e.id}`} className="textarea" style={{ minHeight: 60 }} value={e.quote?.text ?? ''}
                      onChange={(ev) => patchQuote(e.id, ev.target.value ? { text: ev.target.value, edition: e.quote?.edition ?? '', page: e.quote?.page ?? '' } : undefined)} />
                  </div>
                  <div className="field"><label htmlFor={`ed-${e.id}`}>Edition</label>
                    <input id={`ed-${e.id}`} className="input" value={e.quote?.edition ?? ''} disabled={!e.quote} placeholder="e.g. publisher and year"
                      onChange={(ev) => e.quote && patchQuote(e.id, { ...e.quote, edition: ev.target.value })} /></div>
                  <div className="field"><label htmlFor={`pg-${e.id}`}>Page</label>
                    <input id={`pg-${e.id}`} className="input" value={e.quote?.page ?? ''} disabled={!e.quote}
                      onChange={(ev) => e.quote && patchQuote(e.id, { ...e.quote, page: ev.target.value })} /></div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
