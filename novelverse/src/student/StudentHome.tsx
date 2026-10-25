import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useApp } from '../state/store';
import { Starfield } from '../components/Starfield';
import { Icon } from '../components/Icon';
import { href, navigate } from '../lib/router';
import { readingFrontier } from '../lib/knowledge';
import { rangeLabel } from '../lib/generator';
import { stepStates } from './MissionContext';
import { useReading, ReadAloud } from '../components/Reading';
import type { Chapter, Mission, Novel } from '../data/types';
import { play } from '../lib/sound';

export function StudentHome() {
  const novels = useApp((s) => s.novels);
  const missions = useApp((s) => s.missions);
  const published = Object.values(missions).filter((m) => m.status === 'published' && novels[m.novelId]);
  const novelIds = [...new Set(published.map((m) => m.novelId))];

  return (
    <>
      <div className="student-sky" aria-hidden="true"><Starfield density={0.6} /></div>
      <div className="wrap" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        <CadetBar />
        {novelIds.length === 0 && (
          <div className="empty" style={{ marginTop: '2rem' }}>
            <h2>No missions yet</h2>
            <p>Your teacher hasn’t launched a mission. Check back soon.</p>
          </div>
        )}
        {novelIds.map((id) => (
          <NovelWorld key={id} novel={novels[id]} missions={published.filter((m) => m.novelId === id)} />
        ))}
      </div>
    </>
  );
}

function CadetBar() {
  const roster = useApp((s) => s.roster);
  const active = useApp((s) => s.activeStudentId);
  const setActive = useApp((s) => s.setActiveStudent);
  return (
    <div className="cadet-bar">
      <span className="hud">Demo profile</span>
      <label className="row" style={{ gap: '0.5rem' }}>
        <span className="sr-only">Choose a synthetic demo cadet</span>
        <select className="select" style={{ width: 'auto', minHeight: 38 }} value={active} onChange={(e) => setActive(e.target.value)}>
          {roster.map((r) => <option key={r.id} value={r.id}>{r.callSign}</option>)}
        </select>
      </label>
      <span className="small muted">Synthetic cadets only. Switching loads that cadet’s saved progress and support settings.</span>
    </div>
  );
}

function NovelWorld({ novel, missions }: { novel: Novel; missions: Mission[] }) {
  const frontier = readingFrontier(novel);
  const missionChapters = new Set(missions.flatMap((m) => m.chapterNumbers));
  const [selected, setSelected] = useState<Chapter | null>(null);

  return (
    <section aria-labelledby={`novel-${novel.id}`} style={{ marginTop: '1.5rem' }}>
      <motion.header className="world-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <span className="hud accent">Story world · reading frontier: Chapter {frontier}</span>
        <h1 id={`novel-${novel.id}`} className="world-title">{novel.title}</h1>
        <p className="world-author">{novel.author}</p>
        <p className="world-tagline">{novel.tagline}</p>
      </motion.header>

      <div className="panel glow corners" style={{ marginTop: '1.25rem', padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '1rem 1.25rem 0' }}>
          <h2 className="hud" style={{ margin: 0 }}>Star chart · chapters</h2>
          <span className="small muted"><Icon name="lock" size={14} /> Classified chapters open when your teacher unlocks them.</span>
        </div>
        <StoryMap novel={novel} missionChapters={missionChapters} onSelect={(c) => { setSelected(c); play('tap'); }} selected={selected} />
        {selected && <ChapterCard chapter={selected} onClose={() => setSelected(null)} />}
      </div>

      <h2 style={{ marginTop: '2.5rem' }}>Missions</h2>
      <div className="grid cols-2">
        {missions.map((m, i) => <MissionCard key={m.id} mission={m} index={i} />)}
      </div>

      {novel.contentNotes.length > 0 && (
        <details className="content-note">
          <summary>Content notes for this novel</summary>
          <ul>{novel.contentNotes.map((n) => <li key={n}>{n}</li>)}</ul>
          <p className="small muted">If anything in the book is hard for you, talk to your teacher. You can step away from a mission at any time; your progress is saved.</p>
        </details>
      )}
    </section>
  );
}

function StoryMap({ novel, missionChapters, onSelect, selected }: { novel: Novel; missionChapters: Set<number>; onSelect: (c: Chapter) => void; selected: Chapter | null }) {
  const chapters = [...novel.chapters].sort((a, b) => a.number - b.number);
  const n = chapters.length;
  const points = useMemo(
    () => chapters.map((_, i) => {
      const x = 4 + (i / Math.max(n - 1, 1)) * 92;
      const y = 50 + Math.sin(i * 0.9) * 26;
      return { x, y };
    }),
    [n],
  );
  const path = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x * 10} ${p.y * 2.6}`).join(' ');
  const lastOpen = chapters.reduce((acc, c, i) => (c.unlocked ? i : acc), -1);
  const openPath = points.slice(0, lastOpen + 1).map((p, i) => `${i ? 'L' : 'M'} ${p.x * 10} ${p.y * 2.6}`).join(' ');

  return (
    <div className="story-map-scroll">
      <div className="story-map" role="list" aria-label={`${novel.title} chapters`}>
        <svg viewBox="0 0 1000 260" preserveAspectRatio="none" aria-hidden="true" className="story-map-svg">
          <path d={path} className="map-path" />
          <path d={openPath} className="map-path open" />
        </svg>
        {chapters.map((c, i) => {
          const inMission = missionChapters.has(c.number);
          return (
            <div role="listitem" key={c.id} className="map-node-wrap" style={{ left: `${points[i].x}%`, top: `${points[i].y}%` }}>
              <button
                className={`map-node ${c.unlocked ? 'open' : 'locked'} ${inMission ? 'mission' : ''} ${selected?.id === c.id ? 'selected' : ''}`}
                onClick={() => c.unlocked && onSelect(c)}
                aria-disabled={!c.unlocked}
                aria-label={c.unlocked ? `Chapter ${c.number}: ${c.title}${inMission ? ', mission available' : ''}` : `Chapter ${c.number}: classified, not yet unlocked`}
              >
                {c.unlocked ? c.number : <Icon name="lock" size={14} />}
              </button>
              <span className="map-label" aria-hidden="true">{c.unlocked ? c.title : 'Classified'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChapterCard({ chapter, onClose }: { chapter: Chapter; onClose: () => void }) {
  const [show, setShow] = useState(false);
  const r = useReading();
  const text = r.pick(chapter.summary, chapter.plain);
  return (
    <motion.div className="chapter-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="row between">
        <div>
          <span className="hud accent">Chapter {chapter.number}</span>
          <h3 style={{ margin: 0 }}>{chapter.title}</h3>
        </div>
        <button className="btn quiet small" onClick={onClose} aria-label="Close chapter card"><Icon name="close" size={16} /></button>
      </div>
      {!show ? (
        <button className="btn ghost small" style={{ marginTop: '0.75rem' }} onClick={() => setShow(true)}>Show recap</button>
      ) : (
        <div style={{ marginTop: '0.75rem' }}>
          <div className="row top" style={{ flexWrap: 'nowrap' }}>
            <p className="grow" style={{ margin: 0 }}>{text}</p>
            <ReadAloud text={text} />
          </div>
          <p className="tiny muted" style={{ marginTop: '0.5rem' }}>A recap helps you remember. It does not replace reading the chapter.</p>
        </div>
      )}
    </motion.div>
  );
}

const GROUPING_LABEL = { independent: 'Solo', partner: 'Partners', group: 'Squad', 'whole-class': 'Whole class' } as const;

function MissionCard({ mission, index }: { mission: Mission; index: number }) {
  const responses = useApp((s) => s.responses);
  const studentId = useApp((s) => s.activeStudentId);
  const states = stepStates(mission, responses, studentId);
  const done = states.filter((s) => s === 'done').length;
  const started = states.some((s) => s === 'done' || s === 'in-progress');
  const pct = Math.round((done / Math.max(mission.steps.length, 1)) * 100);

  return (
    <motion.article className="mission-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.08 }}>
      <div className="mission-card-glow" aria-hidden="true" />
      <div className="row between">
        <span className="hud accent">Operation · {mission.codename}</span>
        <span className="chip">{rangeLabel(mission.chapterNumbers)}</span>
      </div>
      <h3 className="mission-card-title">{mission.title}</h3>
      <p className="text-2">{mission.summary}</p>
      <div className="row" style={{ gap: '0.4rem' }}>
        <span className="chip">{mission.duration} min</span>
        <span className="chip">{GROUPING_LABEL[mission.grouping]}</span>
        <span className="chip">{mission.steps.length} rooms</span>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <div className="row between small"><span className="muted">Rooms cleared</span><span className="mono">{done}/{mission.steps.length}</span></div>
        <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Mission progress"><span style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="row" style={{ marginTop: '1rem' }}>
        <a className="btn primary" href={href(`/student/mission/${mission.id}`)} onClick={() => play('open')}>
          {done === mission.steps.length ? 'Revisit mission' : started ? 'Continue mission' : 'Begin mission'} <Icon name="next" size={18} />
        </a>
        <button className="btn quiet small" onClick={() => navigate('/student/log')}>Commander’s Log</button>
      </div>
    </motion.article>
  );
}
