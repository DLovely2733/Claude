import { motion } from 'motion/react';
import { useState } from 'react';
import { useApp } from '../state/store';
import { Icon } from '../components/Icon';
import { href, navigate } from '../lib/router';
import { readingFrontier, unverifiedCount } from '../lib/knowledge';
import { uid } from '../lib/id';
import type { Novel, Skin } from '../data/types';
import { toast } from '../components/toast';
import { FileText } from '../components/FileText';

export const SKINS: { id: Skin; name: string; genre: string }[] = [
  { id: 'holo', name: 'Holographic command', genre: 'Science fiction' },
  { id: 'noir', name: 'Noir investigation room', genre: 'Mystery' },
  { id: 'archive', name: 'Historical archive', genre: 'Historical fiction' },
  { id: 'surveillance', name: 'Surveillance state', genre: 'Dystopia' },
  { id: 'atlas', name: 'Illustrated atlas', genre: 'Fantasy & adventure' },
];

export function NovelLibrary() {
  const novels = useApp((s) => s.novels);
  const missions = useApp((s) => s.missions);
  const [adding, setAdding] = useState(false);

  return (
    <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header className="row between">
        <div>
          <span className="hud" style={{ color: 'var(--accent-2)' }}>Novel Engine</span>
          <h1>Your novels</h1>
          <p className="text-2" style={{ maxWidth: 680 }}>
            Each novel is a knowledge base: chapters, characters, events, evidence and themes. Every mission is built from it, so what you enter here is the source of truth.
          </p>
        </div>
        <button className="btn primary" onClick={() => setAdding(true)}><Icon name="plus" size={18} /> Add a novel</button>
      </header>

      {adding && <AddNovel onClose={() => setAdding(false)} />}

      <div className="grid cols-2" style={{ marginTop: '1.5rem' }}>
        {Object.values(novels).map((n, i) => {
          const pending = unverifiedCount(n);
          const count = Object.values(missions).filter((m) => m.novelId === n.id).length;
          return (
            <motion.article key={n.id} className="novel-card" data-skin={n.skin} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <span className="hud accent">{SKINS.find((s) => s.id === n.skin)?.name}</span>
              <h2 className="serif" style={{ margin: '0.3rem 0 0' }}>{n.title}</h2>
              <p className="text-2" style={{ margin: 0 }}>{n.author}</p>
              <div className="row" style={{ gap: '0.35rem', marginTop: '0.8rem' }}>
                <span className="chip">{n.chapters.length} chapters</span>
                <span className="chip">Unlocked to Ch. {readingFrontier(n)}</span>
                <span className="chip">{n.evidence.length} evidence cards</span>
                <span className="chip">{count} missions</span>
                {pending > 0 ? <span className="verify">{pending} to check</span> : <span className="verify ok">All verified</span>}
              </div>
              <div className="row" style={{ marginTop: '1rem' }}>
                <a className="btn primary small" href={href(`/teacher/novel/${n.id}`)}><Icon name="edit" size={16} /> Open knowledge base</a>
                <a className="btn ghost small" href={href(`/teacher/build/${n.id}`)}><Icon name="spark" size={16} /> Generate mission</a>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

function AddNovel({ onClose }: { onClose: () => void }) {
  const saveNovel = useApp((s) => s.saveNovel);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [skin, setSkin] = useState<Skin>('noir');
  const [chapters, setChapters] = useState(12);
  const [themes, setThemes] = useState('');
  const [notes, setNotes] = useState('');

  const create = () => {
    const id = uid('novel');
    const parsed = parseChapterNotes(notes);
    const count = Math.max(chapters, parsed.length);
    const novel: Novel = {
      id, title: title.trim(), author: author.trim(), skin,
      tagline: '', setting: '', contentNotes: [],
      chapters: Array.from({ length: count }, (_, i) => {
        const p = parsed.find((x) => x.number === i + 1);
        return { id: uid('ch'), number: i + 1, title: p?.title ?? `Chapter ${i + 1}`, summary: p?.summary ?? '', unlocked: false, verification: 'teacher-added' as const };
      }),
      characters: [], events: [], evidence: [], vocab: [], techniques: [], relationships: [],
      themes: themes.split(',').map((t) => t.trim()).filter(Boolean).map((t) => ({ id: uid('theme'), topic: t, question: '', ladder: [] })),
      createdBy: 'teacher',
    };
    saveNovel(novel);
    toast(`${novel.title} added`);
    navigate(`/teacher/novel/${id}`);
  };

  return (
    <motion.section className="panel glow" style={{ marginTop: '1.5rem' }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} aria-labelledby="add-h">
      <div className="row between">
        <h2 id="add-h" style={{ margin: 0 }}>Add a novel</h2>
        <button className="btn quiet small" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
      </div>
      <p className="small muted">Start with the basics. You can add characters, events, evidence and themes next. Do not paste whole copyrighted chapters; short excerpts you are permitted to use are fine.</p>
      <div className="grid cols-2">
        <div className="field"><label htmlFor="nv-title">Title</label><input id="nv-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label htmlFor="nv-author">Author</label><input id="nv-author" className="input" value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
        <div className="field"><label htmlFor="nv-ch">Number of chapters or reading sections</label><input id="nv-ch" type="number" min={1} max={120} className="input" value={chapters} onChange={(e) => setChapters(Number(e.target.value))} /></div>
        <div className="field"><label htmlFor="nv-themes">Themes to explore (comma separated)</label><input id="nv-themes" className="input" value={themes} onChange={(e) => setThemes(e.target.value)} placeholder="identity, belonging, justice" /></div>
      </div>
      <fieldset className="plain-fieldset" style={{ marginTop: '1rem' }}>
        <legend className="label">Visual world</legend>
        <div className="skin-grid">
          {SKINS.map((s) => (
            <button key={s.id} type="button" className={`skin-swatch ${skin === s.id ? 'on' : ''}`} data-skin={s.id} aria-pressed={skin === s.id} onClick={() => setSkin(s.id)}>
              <span className="skin-preview" aria-hidden="true"><span /><span /><span /></span>
              <strong>{s.genre}</strong>
              <span className="tiny">{s.name}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="field" style={{ marginTop: '1rem' }}>
        <label htmlFor="nv-notes">Paste chapter notes (optional)</label>
        <textarea id="nv-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder={'One chapter per line, for example:\n1 | The Arrival | Your summary in your own words\nChapter 2: The Letter - Your summary'} />
        <span className="help">Your own summaries. They are marked “teacher added”.</span>
        <FileText label="Load notes from a text file" onText={(t) => setNotes(t)} />
      </div>
      <div className="row end" style={{ marginTop: '1rem' }}>
        <button className="btn quiet" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!title.trim() || !author.trim()} onClick={create}>Create knowledge base</button>
      </div>
    </motion.section>
  );
}

/** "1 | Title | summary" or "Chapter 1: Title - summary". */
export function parseChapterNotes(text: string): { number: number; title: string; summary: string }[] {
  const out: { number: number; title: string; summary: string }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let m = line.match(/^(\d+)\s*\|\s*([^|]+?)\s*(?:\|\s*(.*))?$/);
    if (m) { out.push({ number: Number(m[1]), title: m[2].trim(), summary: (m[3] ?? '').trim() }); continue; }
    m = line.match(/^(?:chapter|ch\.?)\s*(\d+)\s*[:.]\s*(.+?)(?:\s+[-–—]\s+(.*))?$/i);
    if (m) out.push({ number: Number(m[1]), title: m[2].trim(), summary: (m[3] ?? '').trim() });
  }
  return out;
}
