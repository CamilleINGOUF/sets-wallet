import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { actions } from '../store/useStore';
import { MUSCLE_LABELS } from '../data/muscles';
import { SUPERSET_GROUPS, SUPERSET_COLORS } from '../data/supersets';

export const SortableExerciseItem: React.FC<{
  pe: PlannedExercise;
  exercise: Exercise;
  dayId: string;
}> = ({ pe, exercise, dayId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: pe.uid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const cycleSuperset = () => {
    if (!pe.superset) {
      actions.setSuperset(dayId, pe.uid, SUPERSET_GROUPS[0]);
    } else {
      const idx = SUPERSET_GROUPS.indexOf(pe.superset);
      const next = idx < SUPERSET_GROUPS.length - 1 ? SUPERSET_GROUPS[idx + 1] : undefined;
      actions.setSuperset(dayId, pe.uid, next);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: pe.superset ? `3px solid ${SUPERSET_COLORS[pe.superset]}` : undefined,
        paddingLeft: pe.superset ? '0.4rem' : undefined,
      }}
      className="exercise-item"
      {...attributes}
    >
      <span className="drag-handle" {...listeners}>
        ⠿
      </span>
      <button
        className="superset-badge"
        onClick={cycleSuperset}
        style={{
          background: pe.superset ? SUPERSET_COLORS[pe.superset] : undefined,
          color: pe.superset ? '#000' : undefined,
        }}
        title="Click to assign superset group (A→B→C→D→E→none)"
      >
        {pe.superset ?? '·'}
      </button>
      <div className="exercise-info">
        <span className="exercise-name">{exercise.name}</span>
        <span className="exercise-muscle">{MUSCLE_LABELS[exercise.primary]}</span>
      </div>
      <div className="exercise-controls">
        <button
          className="sets-btn"
          onClick={() => pe.sets > 1 && actions.updateSets(dayId, pe.uid, pe.sets - 1)}
        >
          −
        </button>
        <span className="sets-count">{pe.sets}</span>
        <button
          className="sets-btn"
          onClick={() => actions.updateSets(dayId, pe.uid, pe.sets + 1)}
        >
          +
        </button>
        <button
          className="remove-btn"
          onClick={() => actions.removeExerciseFromPlan(dayId, pe.uid)}
        >
          ×
        </button>
      </div>
    </li>
  );
};
