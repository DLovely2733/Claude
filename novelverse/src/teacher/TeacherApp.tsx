import { TopBar } from '../components/TopBar';
import { Dashboard } from './Dashboard';
import { NovelLibrary } from './NovelLibrary';
import { NovelEditor } from './NovelEditor';
import { MissionList } from './MissionList';
import { MissionBuilder } from './MissionBuilder';
import { MissionEditor } from './MissionEditor';
import { Preview } from './Preview';
import { Review } from './Review';
import { CurriculumPage } from './CurriculumPage';
import { ClassPage } from './ClassPage';
import { PrintView } from './PrintView';
import { Projector } from './Projector';

export default function TeacherApp({ route }: { route: string[] }) {
  const [section, id, sub] = route;

  if (section === 'print' && id) return <PrintView missionId={id} />;
  if (section === 'project' && id) return <Projector missionId={id} stepId={sub} />;

  const nav = [
    { to: '/teacher', label: 'Dashboard', current: !section },
    { to: '/teacher/novels', label: 'Novels', current: section === 'novels' || section === 'novel' },
    { to: '/teacher/missions', label: 'Missions', current: section === 'missions' || section === 'mission' || section === 'build' || section === 'preview' },
    { to: '/teacher/review', label: 'Review', current: section === 'review' },
    { to: '/teacher/curriculum', label: 'Curriculum', current: section === 'curriculum' },
    { to: '/teacher/class', label: 'Class', current: section === 'class' },
  ];

  return (
    <>
      <TopBar mode="teacher" nav={nav} right={<span className="chip amber" title="No real student data">Demo · synthetic data</span>} />
      <main id="main" tabIndex={-1} className="teacher-main">
        {section === 'novels' ? <NovelLibrary />
          : section === 'novel' && id ? <NovelEditor novelId={id} tab={sub} />
          : section === 'missions' ? <MissionList />
          : section === 'build' ? <MissionBuilder novelId={id} />
          : section === 'mission' && id ? <MissionEditor missionId={id} />
          : section === 'preview' && id ? <Preview missionId={id} stepId={sub} />
          : section === 'review' ? <Review missionId={id} stepId={sub} />
          : section === 'curriculum' ? <CurriculumPage />
          : section === 'class' ? <ClassPage />
          : <Dashboard />}
      </main>
    </>
  );
}
