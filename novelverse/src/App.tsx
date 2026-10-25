import { lazy, Suspense } from 'react';
import { useRoute } from './lib/router';
import { Shell } from './components/Shell';
import { Landing } from './Landing';
import { StudentApp } from './student/StudentApp';
import { JoinLive } from './student/JoinLive';
import { useApp } from './state/store';

const TeacherApp = lazy(() => import('./teacher/TeacherApp'));

export function App() {
  const route = useRoute();
  const [area] = route;
  const novels = useApp((s) => s.novels);
  const missions = useApp((s) => s.missions);

  // The skin follows whichever novel the screen is about.
  const missionId = route.find((_, i) => route[i - 1] === 'mission' || route[i - 1] === 'preview');
  const novelId = route.find((_, i) => route[i - 1] === 'novel') ?? (missionId ? missions[missionId]?.novelId : undefined);
  const skin = (novelId && novels[novelId]?.skin) || 'holo';

  return (
    <Shell skin={area === 'teacher' && !route.includes('preview') ? 'holo' : skin}>
      {area === 'join' ? (
        <JoinLive code={route[1]} />
      ) : area === 'student' ? (
        <StudentApp route={route.slice(1)} />
      ) : area === 'teacher' ? (
        <Suspense fallback={<div className="loading-screen"><span className="hud accent">Opening Mission Control…</span></div>}>
          <TeacherApp route={route.slice(1)} />
        </Suspense>
      ) : (
        <Landing />
      )}
    </Shell>
  );
}
