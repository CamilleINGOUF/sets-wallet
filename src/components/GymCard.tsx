import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useStore } from '../store/useStore';
import { MUSCLE_LABELS } from '../data/muscles';
import { SUPERSET_COLORS } from '../data/supersets';

type Block = {
  group: SupersetGroup | 'solo';
  exercises: { name: string; muscle: string; sets: number }[];
};

const buildBlocks = (
  day: TrainingDay,
  exerciseMap: Map<string, Exercise>
): Block[] => {
  const blocks: Block[] = [];
  const grouped = new Map<string, Block['exercises']>();

  for (const pe of day.exercises) {
    const ex = exerciseMap.get(pe.exerciseId);
    if (!ex) continue;
    const entry = { name: ex.name, muscle: MUSCLE_LABELS[ex.primary], sets: pe.sets };
    if (pe.superset) {
      if (!grouped.has(pe.superset)) grouped.set(pe.superset, []);
      grouped.get(pe.superset)!.push(entry);
    }
  }

  const seen = new Set<string>();
  for (const pe of day.exercises) {
    const ex = exerciseMap.get(pe.exerciseId);
    if (!ex) continue;
    if (pe.superset) {
      if (seen.has(pe.superset)) continue;
      seen.add(pe.superset);
      blocks.push({ group: pe.superset as SupersetGroup, exercises: grouped.get(pe.superset)! });
    } else {
      blocks.push({
        group: 'solo',
        exercises: [{ name: ex.name, muscle: MUSCLE_LABELS[ex.primary], sets: pe.sets }],
      });
    }
  }
  return blocks;
};

const SupersetLegend: React.FC<{
  days: TrainingDay[];
  exerciseMap: Map<string, Exercise>;
}> = ({ days, exerciseMap }) => {
  const allPairs: { group: SupersetGroup; day: string; names: string[] }[] = [];

  for (const day of days) {
    const grouped = new Map<string, string[]>();
    for (const pe of day.exercises) {
      if (!pe.superset) continue;
      const ex = exerciseMap.get(pe.exerciseId);
      if (!ex) continue;
      if (!grouped.has(pe.superset)) grouped.set(pe.superset, []);
      grouped.get(pe.superset)!.push(ex.name);
    }
    for (const [group, names] of grouped) {
      if (names.length > 1) {
        allPairs.push({ group: group as SupersetGroup, day: day.label, names });
      }
    }
  }

  if (allPairs.length === 0) return null;

  return (
    <div className="gym-card-page gym-card-legend">
      <div className="gym-card-page-header">
        <span className="gym-card-page-plan">Reference</span>
        <span className="gym-card-page-day">Superset Guide</span>
        <span className="gym-card-page-meta">{allPairs.length} supersets total</span>
      </div>
      <div className="gym-card-legend-list">
        {days.filter((d) => d.exercises.length > 0).map((day) => {
          const dayPairs = allPairs.filter((p) => p.day === day.label);
          if (dayPairs.length === 0) return null;
          return (
            <div key={day.id} className="gym-card-legend-day">
              <div className="gym-card-legend-day-title">{day.label}</div>
              {dayPairs.map((pair, i) => (
                <div
                  key={i}
                  className="gym-card-legend-pair"
                  style={{ borderLeftColor: SUPERSET_COLORS[pair.group] }}
                >
                  <span
                    className="gym-card-legend-badge"
                    style={{ background: SUPERSET_COLORS[pair.group] }}
                  >
                    {pair.group}
                  </span>
                  <span className="gym-card-legend-names">
                    {pair.names.join(' + ')}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="gym-card-footer">Sets Wallet</div>
    </div>
  );
};

const DayCardRender: React.FC<{
  day: TrainingDay;
  planName: string;
  exerciseMap: Map<string, Exercise>;
}> = ({ day, planName, exerciseMap }) => {
  const blocks = buildBlocks(day, exerciseMap);
  const totalSets = day.exercises.reduce((s, e) => s + e.sets, 0);
  const supersetCount = blocks.filter((b) => b.group !== 'solo' && b.exercises.length > 1).length;

  return (
    <div className="gym-card-page">
      <div className="gym-card-page-header">
        <span className="gym-card-page-plan">{planName}</span>
        <span className="gym-card-page-day">{day.label}</span>
        <span className="gym-card-page-meta">
          {totalSets} sets · {supersetCount} superset{supersetCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="gym-card-page-blocks">
        {blocks.map((block, i) => {
          const isSuperset = block.group !== 'solo' && block.exercises.length > 1;
          const color = block.group !== 'solo'
            ? SUPERSET_COLORS[block.group as SupersetGroup]
            : undefined;

          return (
            <div
              key={i}
              className={`gym-card-block ${isSuperset ? 'gym-card-superset' : ''}`}
              style={isSuperset ? { borderLeftColor: color } : undefined}
            >
              {isSuperset && (
                <span className="gym-card-ss-label" style={{ color }}>SS</span>
              )}
              {block.exercises.map((ex, j) => (
                <div key={j} className="gym-card-exercise">
                  <span className="gym-card-ex-name">{ex.name}</span>
                  <span className="gym-card-ex-meta">{ex.muscle}</span>
                  <span className="gym-card-ex-sets">{ex.sets}×</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="gym-card-footer">Sets Wallet</div>
    </div>
  );
};

export const GymCard: React.FC = () => {
  const pagesRef = useRef<HTMLDivElement>(null);
  const plan = useStore((s) => s.currentPlan);
  const exercises = useStore((s) => s.exercises);
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const activeDays = plan.days.filter((d) => d.exercises.length > 0);

  const exportPdf = async () => {
    if (!pagesRef.current) return;
    const pages = pagesRef.current.querySelectorAll<HTMLElement>('.gym-card-page');
    if (pages.length === 0) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a5' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();

      // Fill page background
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      const canvas = await html2canvas(pages[i], { backgroundColor: '#0f0f0f', scale: 3 });
      const imgData = canvas.toDataURL('image/png');
      const ratio = canvas.width / canvas.height;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = Math.min(imgWidth / ratio, pageHeight - margin * 2);

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    }

    pdf.save(`${plan.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  return (
    <div>
      <div className="gym-card-actions">
        <button className="export-img-btn" onClick={exportPdf}>
          Download PDF
        </button>
      </div>
      <div ref={pagesRef} className="gym-card-pages">
        {activeDays.map((day) => (
          <div key={day.id} data-day={day.id}>
            <DayCardRender
              day={day}
              planName={plan.name}
              exerciseMap={exerciseMap}
            />
          </div>
        ))}
        <div data-day="legend">
          <SupersetLegend days={plan.days} exerciseMap={exerciseMap} />
        </div>
      </div>
    </div>
  );
};
