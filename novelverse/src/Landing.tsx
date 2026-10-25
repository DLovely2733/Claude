import { motion } from 'motion/react';
import { useState } from 'react';
import { Starfield } from './components/Starfield';
import { Icon } from './components/Icon';
import { navigate } from './lib/router';
import { play } from './lib/sound';
import { useApp } from './state/store';
import { SettingsDrawer } from './components/SettingsDrawer';

const TITLE = 'NOVELVERSE';

export function Landing() {
  const [warp, setWarp] = useState(false);
  const [supports, setSupports] = useState(false);
  const reduced = useApp((s) => s.settings.reducedMotion);
  const missions = useApp((s) => s.missions);
  const novels = useApp((s) => s.novels);
  const featured = Object.values(missions).find((m) => m.status === 'published');
  const featuredNovel = featured && novels[featured.novelId];

  const go = (to: string) => {
    play('unlock');
    if (reduced) return navigate(to);
    setWarp(true);
    setTimeout(() => navigate(to), 650);
  };

  return (
    <main id="main" tabIndex={-1} className="landing">
      <Starfield density={1.2} warp={warp} />
      <div className="landing-rings" aria-hidden="true">
        <span /><span /><span />
      </div>

      <div className="landing-top">
        <span className="hud">Grade 9 English Language Arts · Demo</span>
        <button className="btn ghost small" onClick={() => setSupports(true)} aria-haspopup="dialog">
          <Icon name="settings" size={18} /> Supports
        </button>
      </div>

      <motion.div className="landing-inner" animate={warp ? { scale: 1.08, opacity: 0 } : { scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
        <motion.p className="hud accent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          Every novel is a world
        </motion.p>
        <h1 className="landing-title" aria-label="NovelVerse">
          {TITLE.split('').map((ch, i) => (
            <motion.span key={i} aria-hidden="true"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              {ch}
            </motion.span>
          ))}
        </h1>
        <motion.p className="landing-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          Lead, investigate, argue and decode your way through the novel you are reading.
          Every mission asks one thing: <em>what does the book make you think, and how do you know?</em>
        </motion.p>

        <motion.div className="portals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.6 }}>
          <button className="portal" onClick={() => go('/student')}>
            <span className="portal-glyph" aria-hidden="true"><Icon name="compass" size={30} /></span>
            <span className="hud accent">Student</span>
            <span className="portal-title">Enter the Story</span>
            <span className="portal-desc">Missions, investigations and choices inside the world of your novel.</span>
            <span className="portal-go">Enter <Icon name="next" size={18} /></span>
          </button>
          <button className="portal amber" onClick={() => go('/teacher')}>
            <span className="portal-glyph" aria-hidden="true"><Icon name="layers" size={30} /></span>
            <span className="hud" style={{ color: 'var(--accent-2)' }}>Teacher</span>
            <span className="portal-title">Mission Control</span>
            <span className="portal-desc">Build the novel, design missions, control spoilers and review student thinking.</span>
            <span className="portal-go">Open <Icon name="next" size={18} /></span>
          </button>
        </motion.div>

        {featured && featuredNovel && (
          <motion.div className="now-showing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
            <span className="hud">Now in orbit</span>
            <span><strong className="serif">{featuredNovel.title}</strong> · {featuredNovel.author}</span>
            <span className="chip accent">{featured.title}</span>
          </motion.div>
        )}
      </motion.div>

      <footer className="landing-foot">
        Demonstration mode: synthetic students only. No accounts, no names, nothing sent anywhere. Progress stays in this browser.
      </footer>
      <SettingsDrawer open={supports} onClose={() => setSupports(false)} />
    </main>
  );
}
