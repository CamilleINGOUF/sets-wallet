import { useRef } from 'react';
import { useStore, actions, isDirty } from '../store/useStore';

const handleExportPlan = () => {
  const json = actions.exportPlan();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sets-wallet-plan.json';
  a.click();
  URL.revokeObjectURL(url);
};

export const SavedPlans: React.FC = () => {
  const savedPlans = useStore((s) => s.savedPlans);
  const currentName = useStore((s) => s.currentPlan.name);
  const currentId = useStore((s) => s.currentPlan.id);
  const hasExercises = useStore(
    (s) => s.currentPlan.days.some((d) => d.exercises.length > 0)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = actions.importPlan(reader.result as string);
      if (!result.ok) alert(result.error);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isOverwrite = savedPlans.some((p) => p.id === currentId);

  const handleSave = () => {
    if (hasExercises) {
      actions.savePlan();
    }
  };

  const handleDelete = (planId: string, planName: string) => {
    if (window.confirm(`Delete "${planName}"? This cannot be undone.`)) {
      actions.deletePlan(planId);
    }
  };

  const handleOverwrite = (planId: string, planName: string) => {
    if (
      window.confirm(
        `Overwrite "${planName}" with your current plan "${currentName}"?`
      )
    ) {
      actions.overwritePlan(planId);
    }
  };

  return (
    <div className="saved-plans">
      <h2>Plans</h2>
      <div className="current-plan-name">
        <input
          value={currentName}
          onChange={(e) => actions.renamePlan(e.target.value)}
          placeholder="Plan name..."
        />
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={!hasExercises}
          title={
            !hasExercises
              ? 'Add exercises before saving'
              : isOverwrite
                ? `Overwrite "${currentName}"`
                : 'Save as new plan'
          }
        >
          {isOverwrite ? 'Save' : 'Save New'}
        </button>
        <button className="export-btn" onClick={handleExportPlan}>
          Export
        </button>
        <button className="export-btn" onClick={() => fileInputRef.current?.click()}>
          Import
        </button>
        <button
          className="export-btn"
          onClick={() => { const name = actions.generateDeload(); alert(`Created "${name}" in saved plans`); }}
          disabled={!hasExercises}
          title="Generate a deload version (compounds only, 50% sets)"
        >
          Deload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>
      {savedPlans.length > 0 && (
        <ul className="plan-list">
          {savedPlans.map((p) => (
            <li key={p.id} className={p.id === currentId ? 'plan-active' : ''}>
              <span>{p.name}</span>
              <span className="plan-date">
                {new Date(p.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => {
                  if (
                    isDirty() &&
                    !window.confirm(
                      'You have unsaved changes. Load this plan anyway?'
                    )
                  )
                    return;
                  actions.loadPlan(p.id);
                }}
              >
                Load
              </button>
              <button
                className="overwrite-btn"
                onClick={() => handleOverwrite(p.id, p.name)}
                disabled={!hasExercises}
                title={`Overwrite "${p.name}" with current plan`}
              >
                Save here
              </button>
              <button
                className="remove-btn"
                onClick={() => handleDelete(p.id, p.name)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
