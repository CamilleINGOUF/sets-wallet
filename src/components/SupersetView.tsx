import { useStore } from '../store/useStore';
import { MUSCLE_LABELS } from '../data/muscles';
import { SUPERSET_COLORS } from '../data/supersets';

type SupersetBlock = {
  group: SupersetGroup | 'solo';
  exercises: { pe: PlannedExercise; exercise: Exercise }[];
};

const buildBlocks = (
  day: TrainingDay,
  exerciseMap: Map<string, Exercise>
): SupersetBlock[] => {
  const blocks: SupersetBlock[] = [];
  const grouped = new Map<string, { pe: PlannedExercise; exercise: Exercise }[]>();
  const solos: { pe: PlannedExercise; exercise: Exercise }[] = [];

  for (const pe of day.exercises) {
    const exercise = exerciseMap.get(pe.exerciseId);
    if (!exercise) continue;
    if (pe.superset) {
      if (!grouped.has(pe.superset)) grouped.set(pe.superset, []);
      grouped.get(pe.superset)!.push({ pe, exercise });
    } else {
      solos.push({ pe, exercise });
    }
  }

  // Interleave: process exercises in order, grouping supersets on first occurrence
  const seen = new Set<string>();
  for (const pe of day.exercises) {
    const exercise = exerciseMap.get(pe.exerciseId);
    if (!exercise) continue;

    if (pe.superset) {
      if (seen.has(pe.superset)) continue;
      seen.add(pe.superset);
      blocks.push({
        group: pe.superset,
        exercises: grouped.get(pe.superset)!,
      });
    } else {
      blocks.push({ group: 'solo', exercises: [{ pe, exercise }] });
    }
  }

  return blocks;
};

export const SupersetView: React.FC = () => {
  const plan = useStore((s) => s.currentPlan);
  const exercises = useStore((s) => s.exercises);
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  return (
    <div className="superset-view">
      <div className="planner-header">
        <h2>{plan.name} — Supersets</h2>
      </div>
      <div className="superset-days">
        {plan.days.map((day) => {
          const blocks = buildBlocks(day, exerciseMap);
          if (blocks.length === 0) return (
            <div key={day.id} className="superset-day">
              <h3 className="superset-day-title">{day.label}</h3>
              <div className="superset-empty">Rest</div>
            </div>
          );

          const totalSets = day.exercises.reduce((s, e) => s + e.sets, 0);
          const supersetCount = blocks.filter((b) => b.group !== 'solo' && b.exercises.length > 1).length;

          return (
            <div key={day.id} className="superset-day">
              <div className="superset-day-header">
                <h3 className="superset-day-title">{day.label}</h3>
                <span className="superset-day-meta">
                  {totalSets} sets · {supersetCount} superset{supersetCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="superset-blocks">
                {blocks.map((block, i) => {
                  const isSuperset = block.group !== 'solo' && block.exercises.length > 1;
                  const color = block.group !== 'solo'
                    ? SUPERSET_COLORS[block.group as SupersetGroup]
                    : undefined;

                  return (
                    <div
                      key={i}
                      className={`superset-block ${isSuperset ? 'superset-paired' : 'superset-solo'}`}
                      style={isSuperset ? { borderColor: color } : undefined}
                    >
                      {isSuperset && (
                        <span className="superset-label" style={{ background: color }}>
                          {block.group}
                        </span>
                      )}
                      {block.exercises.map(({ pe, exercise }) => (
                        <div key={pe.uid} className="superset-exercise">
                          <span className="superset-exercise-name">{exercise.name}</span>
                          <span className="superset-exercise-detail">
                            {MUSCLE_LABELS[exercise.primary]} · {pe.sets}s
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
