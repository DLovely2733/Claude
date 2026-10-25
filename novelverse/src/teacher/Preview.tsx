import { useApp } from '../state/store';
import { MissionProvider, PREVIEW_STUDENT } from '../student/MissionContext';
import { MissionHub } from '../student/MissionHub';
import { StepPlayer } from '../student/StepPlayer';
import { Icon } from '../components/Icon';
import { href } from '../lib/router';
import { toast } from '../components/toast';

// The teacher sees exactly what students see, with every room open.
// Preview answers are saved under a separate preview profile that never
// appears in reviews, analytics or exports.
export function Preview({ missionId, stepId }: { missionId: string; stepId?: string }) {
  const mission = useApp((s) => s.missions[missionId]);
  const novel = useApp((s) => (mission ? s.novels[mission.novelId] : undefined));
  const reset = useApp((s) => s.resetMissionProgress);
  if (!mission || !novel) return <div className="wrap"><div className="empty" style={{ marginTop: '2rem' }}>Mission not found.</div></div>;
  return (
    <div className="preview" data-skin={novel.skin}>
      <div className="preview-bar">
        <div className="wrap row between">
          <span className="row small"><Icon name="eye" size={16} /> <strong>Student preview</strong> · {mission.status === 'published' ? 'live' : 'draft, students cannot see it'} · answers here are not saved to any student</span>
          <span className="row">
            <button className="btn quiet small" onClick={() => { reset(PREVIEW_STUDENT, mission.id); toast('Preview answers cleared'); }}>Clear preview answers</button>
            <a className="btn small" href={href(`/teacher/mission/${mission.id}`)}>Back to editor</a>
          </span>
        </div>
      </div>
      <MissionProvider value={{ mission, novel, studentId: PREVIEW_STUDENT, preview: true, base: `/teacher/preview/${mission.id}` }}>
        {stepId ? <StepPlayer stepId={stepId} /> : <MissionHub />}
      </MissionProvider>
    </div>
  );
}
