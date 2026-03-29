import { useStore, actions } from '../store/useStore';
import { MUSCLE_LABELS } from '../data/muscles';
import { PRIORITY_ORDER, PRIORITY_LABELS, VOLUME_PRESETS } from '../data/priorities';
import type { VolumePresetKey } from '../data/priorities';

export const PriorityEditor: React.FC = () => {
  const priorities = useStore((s) => s.musclePriorities);
  const ranges = useStore((s) => s.priorityRanges);

  const activePreset = (Object.entries(VOLUME_PRESETS) as [VolumePresetKey, typeof VOLUME_PRESETS[VolumePresetKey]][]).find(
    ([, preset]) =>
      PRIORITY_ORDER.every(
        (p) => preset.ranges[p].min === ranges[p].min && preset.ranges[p].max === ranges[p].max
      )
  )?.[0] ?? null;

  return (
    <div className="priority-editor">
      <h2>Volume Level</h2>
      <div className="volume-presets">
        {(Object.entries(VOLUME_PRESETS) as [VolumePresetKey, typeof VOLUME_PRESETS[VolumePresetKey]][]).map(
          ([key, preset]) => (
            <button
              key={key}
              className={`volume-preset-btn ${activePreset === key ? 'volume-preset-active' : ''}`}
              onClick={() => actions.applyVolumePreset({ ...preset.ranges })}
            >
              <span className="volume-preset-label">{preset.label}</span>
              <span className="volume-preset-desc">{preset.description}</span>
            </button>
          )
        )}
      </div>

      <div className="range-editor">
        {PRIORITY_ORDER.map((p) => (
          <div key={p} className={`range-row range-${p}`}>
            <span className="range-label">{PRIORITY_LABELS[p]}</span>
            <input
              type="number"
              min={0}
              max={ranges[p].max}
              value={ranges[p].min}
              onChange={(e) =>
                actions.setPriorityRange(p, { ...ranges[p], min: Number(e.target.value) })
              }
              className="range-input"
            />
            <span className="range-sep">–</span>
            <input
              type="number"
              min={ranges[p].min}
              max={30}
              value={ranges[p].max}
              onChange={(e) =>
                actions.setPriorityRange(p, { ...ranges[p], max: Number(e.target.value) })
              }
              className="range-input"
            />
            <span className="range-unit">sets/wk</span>
          </div>
        ))}
      </div>

      <h2>Muscle Priorities</h2>
      <div className="priority-grid">
        {priorities.map((mc) => (
          <div key={mc.muscle} className="priority-row">
            <span className="muscle-name">{MUSCLE_LABELS[mc.muscle]}</span>
            <div className="priority-buttons">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  className={`priority-btn ${mc.priority === p ? `active-${p}` : ''}`}
                  onClick={() => actions.setPriority(mc.muscle, p)}
                  title={`${ranges[p].min}–${ranges[p].max} sets/wk`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
