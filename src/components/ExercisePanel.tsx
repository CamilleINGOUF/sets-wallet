import { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { MUSCLE_LABELS } from '../data/muscles';
import { computeVolume } from '../domain/volume';
import { computeGaps, scoreExercises, sortMusclesByGap, getTopSuggestions } from '../domain/suggestions';

const DraggableExercise: React.FC<{ exercise: Exercise; score?: number }> = ({ exercise, score }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${exercise.id}`,
    data: { type: 'catalog', exerciseId: exercise.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`panel-exercise ${isDragging ? 'panel-exercise-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="panel-exercise-row">
        <span className="panel-exercise-name">{exercise.name}</span>
        {score != null && score > 0 && (
          <span className="panel-exercise-score" title={`Relevance: ${score.toFixed(1)}`} />
        )}
      </div>
      {exercise.secondary.length > 0 && (
        <span className="panel-exercise-secondary">
          +{exercise.secondary.map((m) => MUSCLE_LABELS[m]).join(', ')}
        </span>
      )}
    </div>
  );
};

const GapBadge: React.FC<{ gap: number }> = ({ gap }) => {
  if (gap > 0) return <span className="gap-badge gap-deficit">-{gap.toFixed(1)}</span>;
  if (gap < -0.5) return <span className="gap-badge gap-surplus">+{Math.abs(gap).toFixed(1)}</span>;
  return <span className="gap-badge gap-ok">OK</span>;
};

export const ExercisePanel: React.FC = () => {
  const exercises = useStore((s) => s.exercises);
  const musclePriorities = useStore((s) => s.musclePriorities);
  const plan = useStore((s) => s.currentPlan);
  const secondaryWeight = useStore((s) => s.secondaryWeight);
  const priorityRanges = useStore((s) => s.priorityRanges);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const { gapMap, scoreMap, suggestions } = useMemo(() => {
    const volumes = computeVolume(musclePriorities, exercises, plan, secondaryWeight, priorityRanges);
    const gaps = computeGaps(volumes);
    const scores = scoreExercises(exercises, gaps, secondaryWeight);
    return {
      gapMap: new Map(gaps.map((g) => [g.muscle, g])),
      scoreMap: new Map(scores.map((s) => [s.exerciseId, s])),
      suggestions: getTopSuggestions(scores),
    };
  }, [musclePriorities, exercises, plan, secondaryWeight, priorityRanges]);

  const sortedMuscles = useMemo(() => {
    const gaps = [...gapMap.values()];
    return sortMusclesByGap(gaps).map((g) => g.muscle);
  }, [gapMap]);

  const matchesSearch = (name: string) =>
    search === '' || name.toLowerCase().includes(search.toLowerCase());

  const grouped = sortedMuscles
    .map((muscle) => ({
      muscle,
      label: MUSCLE_LABELS[muscle],
      gap: gapMap.get(muscle)?.gap ?? 0,
      exercises: exercises.filter((e) => e.primary === muscle && matchesSearch(e.name)),
    }))
    .filter((g) => g.exercises.length > 0);

  const filteredSuggestions = suggestions.filter((s) => {
    const ex = exercises.find((e) => e.id === s.exerciseId);
    return ex && matchesSearch(ex.name);
  });

  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  return (
    <div className={`exercise-panel ${collapsed ? 'panel-collapsed' : ''}`}>
      <button
        className="panel-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? '→' : '←'} Exercises
      </button>
      {!collapsed && (
        <>
          <input
            className="panel-search"
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="panel-groups">
            {filteredSuggestions.length > 0 && (
              <div className="panel-group panel-suggested">
                <h4 className="panel-group-title panel-suggested-title">Suggested</h4>
                {filteredSuggestions.map((s) => {
                  const ex = exerciseMap.get(s.exerciseId);
                  if (!ex) return null;
                  return <DraggableExercise key={ex.id} exercise={ex} score={s.score} />;
                })}
              </div>
            )}
            {grouped.map((g) => (
              <div key={g.muscle} className="panel-group">
                <h4 className="panel-group-title">
                  {g.label} <GapBadge gap={g.gap} />
                </h4>
                {g.exercises.map((ex) => (
                  <DraggableExercise key={ex.id} exercise={ex} score={scoreMap.get(ex.id)?.score} />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
