import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { useStore, actions } from '../store/useStore';
import { DayCard } from './DayCard';
import { ExercisePanel } from './ExercisePanel';
import { SupersetView } from './SupersetView';
import { GymCard } from './GymCard';
import { TemplatePicker } from './TemplatePicker';
import { computeVolume } from '../domain/volume';
import { computeGaps, scoreExercises } from '../domain/suggestions';

type ViewMode = 'list' | 'supersets' | 'gym-card';

export const WeekPlanner: React.FC = () => {
  const plan = useStore((s) => s.currentPlan);
  const exercises = useStore((s) => s.exercises);
  const musclePriorities = useStore((s) => s.musclePriorities);
  const secondaryWeight = useStore((s) => s.secondaryWeight);
  const priorityRanges = useStore((s) => s.priorityRanges);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const isEmpty = plan.days.every((d) => d.exercises.length === 0);

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const scoreMap = useMemo(() => {
    const volumes = computeVolume(musclePriorities, exercises, plan, secondaryWeight, priorityRanges);
    const gaps = computeGaps(volumes);
    const scores = scoreExercises(exercises, gaps, secondaryWeight);
    return new Map(scores.map((s) => [s.exerciseId, s]));
  }, [musclePriorities, exercises, plan, secondaryWeight, priorityRanges]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as
      | { type: 'catalog'; exerciseId: string }
      | undefined;

    if (activeData?.type === 'catalog') {
      const overId = String(over.id);
      const targetDay = plan.days.find(
        (d) =>
          overId === `day-${d.id}` ||
          d.exercises.some((pe) => pe.uid === overId)
      );
      if (targetDay) {
        const suggestedSets = scoreMap.get(activeData.exerciseId)?.suggestedSets ?? 3;
        actions.addExerciseToPlan(targetDay.id, activeData.exerciseId, suggestedSets);
      }
      return;
    }

    if (active.id === over.id) return;

    for (const day of plan.days) {
      const oldIndex = day.exercises.findIndex((pe) => pe.uid === active.id);
      const newIndex = day.exercises.findIndex((pe) => pe.uid === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        actions.reorderExercises(day.id, oldIndex, newIndex);
        return;
      }
    }
  };

  const activeExercise = activeId
    ? (() => {
        const data = activeId.startsWith('catalog-')
          ? exerciseMap.get(activeId.replace('catalog-', ''))
          : (() => {
              for (const day of plan.days) {
                const pe = day.exercises.find((e) => e.uid === activeId);
                if (pe) return exerciseMap.get(pe.exerciseId);
              }
              return undefined;
            })();
        return data;
      })()
    : null;

  const toggle = (
    <div className="view-toggle">
      <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
        List
      </button>
      <button className={view === 'supersets' ? 'active' : ''} onClick={() => setView('supersets')}>
        Supersets
      </button>
      <button className={view === 'gym-card' ? 'active' : ''} onClick={() => setView('gym-card')}>
        Gym Card
      </button>
    </div>
  );

  if (view === 'supersets') {
    return (
      <div>
        {toggle}
        <SupersetView />
      </div>
    );
  }

  if (view === 'gym-card') {
    return (
      <div>
        {toggle}
        <GymCard />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
    >
      {toggle}
      <div className="planner-layout">
        <ExercisePanel />
        <div className="planner-main">
          <div className="planner-header">
            <h2>{plan.name}</h2>
          </div>
          {isEmpty && <TemplatePicker />}
          <div className="days-grid">
            {plan.days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                exercises={exercises}
                exerciseMap={exerciseMap}
                scoreMap={scoreMap}
              />
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeExercise ? (
          <div className="drag-overlay-item">{activeExercise.name}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
