import { useStore } from '../store/useStore';
import { computeFrequency } from '../domain/frequency';
import { MUSCLE_LABELS, MUSCLE_GROUPS } from '../data/muscles';

const intensityColor = (sets: number, maxSets: number): string => {
  if (sets === 0) return 'transparent';
  const ratio = Math.min(sets / maxSets, 1);
  const alpha = 0.15 + ratio * 0.65;
  return `rgba(108, 140, 255, ${alpha})`;
};

export const FrequencyHeatmap: React.FC = () => {
  const exercises = useStore((s) => s.exercises);
  const plan = useStore((s) => s.currentPlan);
  const secondaryWeight = useStore((s) => s.secondaryWeight);

  const frequencies = computeFrequency(exercises, plan, secondaryWeight);
  const freqMap = new Map(frequencies.map((f) => [f.muscle, f]));

  const maxSets = Math.max(
    ...frequencies.flatMap((f) => f.hits.map((h) => h.sets)),
    1
  );

  return (
    <div className="heatmap">
      <h2>Frequency & Recovery</h2>
      <div className="heatmap-scroll">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th>Muscle</th>
              {plan.days.map((d) => (
                <th key={d.id}>{d.label.slice(0, 3)}</th>
              ))}
              <th>Freq</th>
            </tr>
          </thead>
          <tbody>
            {MUSCLE_GROUPS.map((muscle) => {
              const freq = freqMap.get(muscle);
              const hitMap = new Map((freq?.hits ?? []).map((h) => [h.dayId, h]));

              return (
                <tr key={muscle} className={freq?.hasConsecutive ? 'heatmap-consecutive' : ''}>
                  <td className="heatmap-muscle">{MUSCLE_LABELS[muscle]}</td>
                  {plan.days.map((d) => {
                    const hit = hitMap.get(d.id);
                    return (
                      <td
                        key={d.id}
                        className="heatmap-cell"
                        style={{ background: hit ? intensityColor(hit.sets, maxSets) : undefined }}
                        title={hit ? `${hit.sets} sets` : ''}
                      >
                        {hit ? hit.sets : ''}
                      </td>
                    );
                  })}
                  <td className={`heatmap-freq ${freq?.hasConsecutive ? 'heatmap-warn' : ''}`}>
                    {freq?.frequency ?? 0}x
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
