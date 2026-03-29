import { useStore } from '../store/useStore';
import { computeVolume } from '../domain/volume';
import { MUSCLE_LABELS } from '../data/muscles';
import { PRIORITY_LABELS } from '../data/priorities';

const STATUS_INDICATOR: Record<MuscleVolume['status'], string> = {
  under: '↓',
  'on-target': '✓',
  over: '↑',
};

const STATUS_CLASS: Record<MuscleVolume['status'], string> = {
  under: 'status-under',
  'on-target': 'status-ok',
  over: 'status-over',
};

export const VolumeDashboard: React.FC = () => {
  const priorities = useStore((s) => s.musclePriorities);
  const exercises = useStore((s) => s.exercises);
  const plan = useStore((s) => s.currentPlan);
  const secondaryWeight = useStore((s) => s.secondaryWeight);
  const priorityRanges = useStore((s) => s.priorityRanges);

  const volumes = computeVolume(priorities, exercises, plan, secondaryWeight, priorityRanges);
  const totalSets = volumes.reduce((sum, v) => sum + v.primarySets, 0);
  const totalDays = plan.days.length;

  return (
    <div className="dashboard">
      <h2>Weekly Volume</h2>
      <table>
        <thead>
          <tr>
            <th>Muscle</th>
            <th>Priority</th>
            <th>Target</th>
            <th>Primary</th>
            <th>Secondary</th>
            <th>Effective</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {volumes.map((v) => (
            <tr key={v.muscle} className={STATUS_CLASS[v.status]}>
              <td>{MUSCLE_LABELS[v.muscle]}</td>
              <td>{PRIORITY_LABELS[v.priority]}</td>
              <td>
                {v.target.min}–{v.target.max}
              </td>
              <td>{v.primarySets}</td>
              <td>{v.secondarySets > 0 ? `${v.secondarySets} (×${secondaryWeight})` : '–'}</td>
              <td className="effective">{v.effectiveSets}</td>
              <td className={`status ${STATUS_CLASS[v.status]}`}>
                {STATUS_INDICATOR[v.status]}{' '}
                {v.status === 'under' && `(${(v.effectiveSets - v.target.min).toFixed(1)})`}
                {v.status === 'over' && `(+${(v.effectiveSets - v.target.max).toFixed(1)})`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="summary">
        <span>Total direct sets: {totalSets}</span>
        <span>Training days: {totalDays}</span>
        <span>Avg sets/session: {totalDays > 0 ? (totalSets / totalDays).toFixed(1) : 0}</span>
      </div>
    </div>
  );
};
