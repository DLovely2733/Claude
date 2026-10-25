import { useApp } from '../state/store';
import { TopBar } from '../components/TopBar';
import { StudentHome } from './StudentHome';
import { MissionHub } from './MissionHub';
import { StepPlayer } from './StepPlayer';
import { CommandersLog } from './CommandersLog';
import { MissionProvider } from './MissionContext';
import { navigate } from '../lib/router';
import { useEffect } from 'react';

export function StudentApp({ route }: { route: string[] }) {
  const [section, id, stepId] = route;
  const roster = useApp((s) => s.roster);
  const activeId = useApp((s) => s.activeStudentId);
  const cadet = roster.find((r) => r.id === activeId);
  const mission = useApp((s) => (section === 'mission' && id ? s.missions[id] : undefined));
  const novel = useApp((s) => (mission ? s.novels[mission.novelId] : undefined));

  // Students only ever reach published missions.
  const blocked = section === 'mission' && (!mission || mission.status !== 'published' || !novel);
  useEffect(() => {
    if (blocked) navigate('/student');
  }, [blocked]);

  const nav = [
    { to: '/student', label: 'Story Map', current: !section },
    { to: '/student/log', label: 'Commander’s Log', current: section === 'log' },
  ];

  return (
    <>
      <TopBar mode="student" nav={nav} right={cadet && <span className="chip accent" title="Synthetic demo profile">◉ {cadet.callSign}</span>} />
      <main id="main" tabIndex={-1} className="student-main">
        {section === 'log' ? (
          <CommandersLog />
        ) : section === 'mission' && mission && novel && !blocked ? (
          <MissionProvider value={{ mission, novel, studentId: activeId, preview: false, base: `/student/mission/${mission.id}` }}>
            {stepId ? <StepPlayer stepId={stepId} /> : <MissionHub />}
          </MissionProvider>
        ) : (
          <StudentHome />
        )}
      </main>
    </>
  );
}
