import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { actions } from '../store/useStore';
import { MUSCLE_LABELS } from '../data/muscles';
import { diagnoseDay } from '../domain/diagnostics';
import { SortableExerciseItem } from './SortableExerciseItem';
import { DayDiagnostics } from './DayDiagnostics';

export const DayCard: React.FC<{
  day: TrainingDay;
  exercises: Exercise[];
  exerciseMap: Map<string, Exercise>;
  scoreMap: Map<string, ExerciseScore>;
}> = ({ day, exercises, exerciseMap, scoreMap }) => {
  const [adding, setAdding] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedSets, setSelectedSets] = useState(3);
  const [filterMuscle, setFilterMuscle] = useState('');

  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.id}` });

  const filteredExercises = filterMuscle
    ? exercises.filter((e) => e.primary === filterMuscle)
    : exercises;

  const diagnostics = diagnoseDay(day, exerciseMap);
  const totalSets = day.exercises.reduce((s, e) => s + e.sets, 0);

  const handleAdd = () => {
    if (!selectedExercise) return;
    actions.addExerciseToPlan(day.id, selectedExercise, selectedSets);
    setAdding(false);
    setSelectedExercise('');
    setSelectedSets(3);
    setFilterMuscle('');
  };

  return (
    <div
      ref={setNodeRef}
      className={`day-card ${isOver ? 'day-card-over' : ''}`}
    >
      <div className="day-header">
        <h3>{day.label}</h3>
        <span className="day-sets">{totalSets} sets</span>
      </div>
      <DayDiagnostics diagnostics={diagnostics} />
      <SortableContext
        items={day.exercises.map((pe) => pe.uid)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="exercise-list">
          {day.exercises.map((pe) => {
            const ex = exerciseMap.get(pe.exerciseId);
            if (!ex) return null;
            return (
              <SortableExerciseItem
                key={pe.uid}
                pe={pe}
                exercise={ex}
                dayId={day.id}
              />
            );
          })}
        </ul>
      </SortableContext>
      {adding ? (
        <div className="add-exercise-form">
          <select
            value={filterMuscle}
            onChange={(e) => {
              setFilterMuscle(e.target.value);
              setSelectedExercise('');
            }}
          >
            <option value="">All muscles</option>
            {Object.entries(MUSCLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={selectedExercise}
            onChange={(e) => {
              const exId = e.target.value;
              setSelectedExercise(exId);
              if (exId) {
                const score = scoreMap.get(exId);
                if (score) setSelectedSets(score.suggestedSets);
              }
            }}
          >
            <option value="">Select exercise...</option>
            {filteredExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={10}
            value={selectedSets}
            onChange={(e) => setSelectedSets(Number(e.target.value))}
            className="sets-input"
          />
          {selectedExercise && (() => {
            const score = scoreMap.get(selectedExercise);
            const ex = exerciseMap.get(selectedExercise);
            if (!score || !ex || score.primaryGap <= 0) return null;
            return (
              <span className="sets-hint">
                {MUSCLE_LABELS[ex.primary]} needs ~{score.primaryGap.toFixed(1)} more sets
              </span>
            );
          })()}
          <button className="confirm-btn" onClick={handleAdd}>
            Add
          </button>
          <button className="cancel-btn" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="add-btn" onClick={() => setAdding(true)}>
          + Add Exercise
        </button>
      )}
    </div>
  );
};
