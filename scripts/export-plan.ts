import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Types (mirrored from src/types.d.ts) ────────────────────────────

type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'abs' | 'forearms';

type Priority = 'priority' | 'moderate' | 'maintenance';
type SetRange = { min: number; max: number };
type MuscleConfig = { muscle: MuscleGroup; priority: Priority };
type Exercise = { id: string; name: string; primary: MuscleGroup; secondary: MuscleGroup[] };
type PlannedExercise = { exerciseId: string; sets: number };
type TrainingDay = { id: string; label: string; exercises: PlannedExercise[] };
type WeeklyPlan = { id: string; name: string; createdAt: string; days: TrainingDay[] };

type AppState = {
  musclePriorities: MuscleConfig[];
  exercises: Exercise[];
  currentPlan: WeeklyPlan;
  savedPlans: WeeklyPlan[];
  secondaryWeight: number;
};

type VolumeStatus = 'under' | 'on-target' | 'over';

type MuscleVolume = {
  muscle: MuscleGroup;
  priority: Priority;
  target: SetRange;
  primarySets: number;
  secondarySets: number;
  effectiveSets: number;
  status: VolumeStatus;
};

// ── Constants ────────────────────────────────────────────────────────

const PRIORITY_RANGES: Record<Priority, SetRange> = {
  priority: { min: 15, max: 18 },
  moderate: { min: 6, max: 14 },
  maintenance: { min: 6, max: 8 },
};

const PRIORITY_LABELS: Record<Priority, string> = {
  priority: 'Priority',
  moderate: 'Moderate',
  maintenance: 'Maintenance',
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  biceps: 'Biceps', triceps: 'Triceps', quads: 'Quads',
  hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves',
  abs: 'Abs / Core', forearms: 'Forearms',
};

const IDEAL_SETS_PER_SESSION = { min: 16, max: 24 };
const OVERLOADED_THRESHOLD = 25;
const LIGHT_THRESHOLD = 8;
const COMPOUND_RATIO_MINIMUM = 0.4;
const SECONDARY_DEPENDENCY_THRESHOLD = 0.6;

// ── Volume computation ──────────────────────────────────────────────

const computeVolume = (state: AppState): MuscleVolume[] => {
  const exerciseMap = new Map(state.exercises.map((e) => [e.id, e]));
  const totals = new Map<MuscleGroup, { primary: number; secondary: number }>();

  for (const mc of state.musclePriorities) {
    totals.set(mc.muscle, { primary: 0, secondary: 0 });
  }

  for (const day of state.currentPlan.days) {
    for (const pe of day.exercises) {
      const exercise = exerciseMap.get(pe.exerciseId);
      if (!exercise) continue;

      const primaryEntry = totals.get(exercise.primary);
      if (primaryEntry) primaryEntry.primary += pe.sets;

      for (const sec of exercise.secondary) {
        const secEntry = totals.get(sec);
        if (secEntry) secEntry.secondary += pe.sets;
      }
    }
  }

  return state.musclePriorities.map((mc) => {
    const t = totals.get(mc.muscle) ?? { primary: 0, secondary: 0 };
    const target = PRIORITY_RANGES[mc.priority];
    const effectiveSets = t.primary + t.secondary * state.secondaryWeight;

    let status: VolumeStatus = 'on-target';
    if (effectiveSets < target.min) status = 'under';
    else if (effectiveSets > target.max) status = 'over';

    return {
      muscle: mc.muscle,
      priority: mc.priority,
      target,
      primarySets: t.primary,
      secondarySets: t.secondary,
      effectiveSets,
      status,
    };
  });
};

// ── Daily analysis ──────────────────────────────────────────────────

type DayAnalysis = {
  label: string;
  totalSets: number;
  primaryMuscles: Set<MuscleGroup>;
  allMuscles: Set<MuscleGroup>;
  exerciseNames: string[];
  isOverloaded: boolean;
  isTooLight: boolean;
  isUnfocused: boolean;
};

const analyzeDays = (state: AppState): DayAnalysis[] => {
  const exerciseMap = new Map(state.exercises.map((e) => [e.id, e]));

  return state.currentPlan.days.map((day) => {
    const totalSets = day.exercises.reduce((sum, pe) => sum + pe.sets, 0);
    const primaryMuscles = new Set<MuscleGroup>();
    const allMuscles = new Set<MuscleGroup>();
    const exerciseNames: string[] = [];

    for (const pe of day.exercises) {
      const ex = exerciseMap.get(pe.exerciseId);
      if (!ex) continue;
      exerciseNames.push(`${ex.name} (${pe.sets}x)`);
      primaryMuscles.add(ex.primary);
      allMuscles.add(ex.primary);
      for (const sec of ex.secondary) allMuscles.add(sec);
    }

    return {
      label: day.label,
      totalSets,
      primaryMuscles,
      allMuscles,
      exerciseNames,
      isOverloaded: totalSets > OVERLOADED_THRESHOLD,
      isTooLight: totalSets > 0 && totalSets < LIGHT_THRESHOLD,
      isUnfocused: primaryMuscles.size > 5,
    };
  });
};

// ── Exercise selection ──────────────────────────────────────────────

type SelectionAnalysis = {
  totalExercises: number;
  compounds: number;
  isolations: number;
  compoundRatio: number;
  isIsolationHeavy: boolean;
  musclesWithOnlyIsolations: MuscleGroup[];
};

const analyzeSelection = (state: AppState): SelectionAnalysis => {
  const exerciseMap = new Map(state.exercises.map((e) => [e.id, e]));
  const allPlanned = state.currentPlan.days.flatMap((d) => d.exercises);

  let compounds = 0;
  let isolations = 0;
  const muscleHasCompound = new Set<MuscleGroup>();
  const musclesTrained = new Set<MuscleGroup>();

  for (const pe of allPlanned) {
    const ex = exerciseMap.get(pe.exerciseId);
    if (!ex) continue;
    musclesTrained.add(ex.primary);
    if (ex.secondary.length > 0) {
      compounds++;
      muscleHasCompound.add(ex.primary);
    } else {
      isolations++;
    }
  }

  const total = compounds + isolations;
  const ratio = total > 0 ? compounds / total : 0;

  const musclesWithOnlyIsolations: MuscleGroup[] = [];
  for (const m of musclesTrained) {
    if (!muscleHasCompound.has(m)) musclesWithOnlyIsolations.push(m);
  }

  return {
    totalExercises: total,
    compounds,
    isolations,
    compoundRatio: ratio,
    isIsolationHeavy: ratio < COMPOUND_RATIO_MINIMUM,
    musclesWithOnlyIsolations,
  };
};

// ── Recovery analysis ───────────────────────────────────────────────

type RecoveryIssue = {
  muscle: MuscleGroup;
  days: string[];
  hasConsecutive: boolean;
};

const analyzeRecovery = (state: AppState): RecoveryIssue[] => {
  const exerciseMap = new Map(state.exercises.map((e) => [e.id, e]));
  const muscleDays = new Map<MuscleGroup, number[]>();

  state.currentPlan.days.forEach((day, dayIndex) => {
    for (const pe of day.exercises) {
      const ex = exerciseMap.get(pe.exerciseId);
      if (!ex) continue;
      if (!muscleDays.has(ex.primary)) muscleDays.set(ex.primary, []);
      muscleDays.get(ex.primary)!.push(dayIndex);
    }
  });

  const issues: RecoveryIssue[] = [];
  for (const [muscle, indices] of muscleDays) {
    const sorted = [...new Set(indices)].sort((a, b) => a - b);
    let hasConsecutive = false;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) {
        hasConsecutive = true;
        break;
      }
    }
    const dayLabels = sorted.map((i) => state.currentPlan.days[i].label);
    if (hasConsecutive || sorted.length > 0) {
      issues.push({ muscle, days: dayLabels, hasConsecutive });
    }
  }

  return issues;
};

// ── Duplicate exercises ─────────────────────────────────────────────

type DuplicateInfo = {
  exerciseName: string;
  count: number;
  days: string[];
  hasConsecutiveDays: boolean;
};

const findDuplicates = (state: AppState): DuplicateInfo[] => {
  const exerciseMap = new Map(state.exercises.map((e) => [e.id, e]));
  const exerciseDays = new Map<string, { name: string; dayIndices: number[] }>();

  state.currentPlan.days.forEach((day, dayIndex) => {
    for (const pe of day.exercises) {
      const ex = exerciseMap.get(pe.exerciseId);
      if (!ex) continue;
      if (!exerciseDays.has(pe.exerciseId)) {
        exerciseDays.set(pe.exerciseId, { name: ex.name, dayIndices: [] });
      }
      exerciseDays.get(pe.exerciseId)!.dayIndices.push(dayIndex);
    }
  });

  const duplicates: DuplicateInfo[] = [];
  for (const [, info] of exerciseDays) {
    if (info.dayIndices.length > 1) {
      const sorted = info.dayIndices.sort((a, b) => a - b);
      let hasConsecutive = false;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] === 1) { hasConsecutive = true; break; }
      }
      duplicates.push({
        exerciseName: info.name,
        count: info.dayIndices.length,
        days: sorted.map((i) => state.currentPlan.days[i].label),
        hasConsecutiveDays: hasConsecutive,
      });
    }
  }

  return duplicates;
};

// ── Secondary dependency ────────────────────────────────────────────

type SecondaryDep = {
  muscle: MuscleGroup;
  primarySets: number;
  effectiveSets: number;
  secondaryPct: number;
  isHighDependency: boolean;
  isPriorityWithNoDirect: boolean;
};

const analyzeSecondaryDependency = (volumes: MuscleVolume[], priorities: MuscleConfig[]): SecondaryDep[] => {
  const priorityMap = new Map(priorities.map((p) => [p.muscle, p.priority]));

  return volumes
    .filter((v) => v.effectiveSets > 0)
    .map((v) => {
      const secondaryContribution = v.effectiveSets - v.primarySets;
      const secondaryPct = v.effectiveSets > 0 ? secondaryContribution / v.effectiveSets : 0;
      const priority = priorityMap.get(v.muscle) ?? 'moderate';

      return {
        muscle: v.muscle,
        primarySets: v.primarySets,
        effectiveSets: v.effectiveSets,
        secondaryPct,
        isHighDependency: secondaryPct > SECONDARY_DEPENDENCY_THRESHOLD,
        isPriorityWithNoDirect: v.primarySets === 0 && priority === 'priority',
      };
    })
    .filter((d) => d.isHighDependency || d.isPriorityWithNoDirect);
};

// ── Output formatting ───────────────────────────────────────────────

const pad = (s: string, len: number) => s.padEnd(len);
const padNum = (n: number, len: number) => String(n).padStart(len);
const fmtFloat = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(1);

const STATUS_SYMBOL: Record<VolumeStatus, string> = {
  under: 'UNDER',
  'on-target': 'OK',
  over: 'OVER',
};

const printReport = (state: AppState): void => {
  const plan = state.currentPlan;
  const volumes = computeVolume(state);
  const dayAnalyses = analyzeDays(state);
  const selection = analyzeSelection(state);
  const recovery = analyzeRecovery(state);
  const duplicates = findDuplicates(state);
  const secondaryDeps = analyzeSecondaryDependency(volumes, state.musclePriorities);

  const totalSets = volumes.reduce((sum, v) => sum + v.primarySets, 0);
  const trainingDays = plan.days.filter((d) => d.exercises.length > 0).length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TRAINING PLAN CRITIQUE: "${plan.name}"`);
  console.log(`${trainingDays} training days | ${totalSets} total direct sets/week`);
  console.log(`${'='.repeat(60)}\n`);

  // Volume table
  console.log('WEEKLY VOLUME SUMMARY');
  console.log('-'.repeat(60));
  console.log(
    `${pad('Muscle', 14)} ${pad('Priority', 13)} ${pad('Target', 8)} ${pad('Primary', 8)} ${pad('2nd(*w)', 10)} ${pad('Effective', 10)} Status`
  );
  console.log('-'.repeat(60));

  for (const v of volumes) {
    const secondaryStr = v.secondarySets > 0
      ? `${v.secondarySets} (x${state.secondaryWeight})`
      : '-';
    const delta = v.status === 'under'
      ? ` (${fmtFloat(v.effectiveSets - v.target.min)})`
      : v.status === 'over'
        ? ` (+${fmtFloat(v.effectiveSets - v.target.max)})`
        : '';

    console.log(
      `${pad(MUSCLE_LABELS[v.muscle], 14)} ${pad(PRIORITY_LABELS[v.priority], 13)} ${pad(`${v.target.min}-${v.target.max}`, 8)} ${padNum(v.primarySets, 7)}  ${pad(secondaryStr, 10)} ${pad(fmtFloat(v.effectiveSets), 9)}  ${STATUS_SYMBOL[v.status]}${delta}`
    );
  }

  const underCount = volumes.filter((v) => v.status === 'under').length;
  const overCount = volumes.filter((v) => v.status === 'over').length;
  const okCount = volumes.filter((v) => v.status === 'on-target').length;
  console.log(`\nSummary: ${okCount} on target, ${underCount} under, ${overCount} over\n`);

  // Daily breakdown
  console.log('DAILY BREAKDOWN');
  console.log('-'.repeat(60));
  for (const da of dayAnalyses) {
    if (da.exerciseNames.length === 0) {
      console.log(`${da.label}: Rest day`);
      continue;
    }
    const flags: string[] = [];
    if (da.isOverloaded) flags.push('OVERLOADED');
    if (da.isTooLight) flags.push('TOO LIGHT');
    if (da.isUnfocused) flags.push('UNFOCUSED');
    const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
    console.log(`${da.label} (${da.totalSets} sets, ${da.primaryMuscles.size} primary muscles)${flagStr}`);
    for (const name of da.exerciseNames) {
      console.log(`  - ${name}`);
    }
    console.log(`  Muscles: ${[...da.primaryMuscles].map((m) => MUSCLE_LABELS[m]).join(', ')}`);
    console.log();
  }

  // Exercise selection
  console.log('EXERCISE SELECTION');
  console.log('-'.repeat(60));
  console.log(`Compounds: ${selection.compounds} | Isolations: ${selection.isolations} | Ratio: ${(selection.compoundRatio * 100).toFixed(0)}% compound`);
  if (selection.isIsolationHeavy) {
    console.log('WARNING: Isolation-heavy program. Aim for at least 50% compounds.');
  }
  if (selection.musclesWithOnlyIsolations.length > 0) {
    console.log(`WARNING: These muscles have no compound work: ${selection.musclesWithOnlyIsolations.map((m) => MUSCLE_LABELS[m]).join(', ')}`);
  }
  console.log();

  // Recovery
  const consecutiveIssues = recovery.filter((r) => r.hasConsecutive);
  if (consecutiveIssues.length > 0) {
    console.log('RECOVERY CONCERNS');
    console.log('-'.repeat(60));
    for (const issue of consecutiveIssues) {
      console.log(`${MUSCLE_LABELS[issue.muscle]}: trained on consecutive days (${issue.days.join(', ')})`);
    }
    console.log();
  }

  // Frequency
  console.log('FREQUENCY');
  console.log('-'.repeat(60));
  const priorityMap = new Map(state.musclePriorities.map((p) => [p.muscle, p.priority]));
  for (const r of recovery) {
    const priority = priorityMap.get(r.muscle) ?? 'moderate';
    const freq = r.days.length;
    let ideal = '';
    if (priority === 'priority') ideal = '2-3x/week';
    else if (priority === 'moderate') ideal = '1-2x/week';
    else ideal = '1x/week';
    const warning = (priority === 'priority' && freq < 2) ? ' [LOW]'
      : (priority === 'maintenance' && freq > 2) ? ' [HIGH]'
        : '';
    console.log(`${pad(MUSCLE_LABELS[r.muscle], 14)} ${freq}x/week (ideal: ${ideal})${warning}`);
  }
  console.log();

  // Duplicates
  if (duplicates.length > 0) {
    console.log('DUPLICATE EXERCISES');
    console.log('-'.repeat(60));
    for (const dup of duplicates) {
      const consec = dup.hasConsecutiveDays ? ' [consecutive days!]' : '';
      console.log(`${dup.exerciseName}: ${dup.count}x (${dup.days.join(', ')})${consec}`);
    }
    console.log();
  }

  // Secondary dependency
  if (secondaryDeps.length > 0) {
    console.log('SECONDARY DEPENDENCY WARNINGS');
    console.log('-'.repeat(60));
    for (const dep of secondaryDeps) {
      if (dep.isPriorityWithNoDirect) {
        console.log(`${MUSCLE_LABELS[dep.muscle]}: PRIORITY muscle with ZERO direct sets! All ${fmtFloat(dep.effectiveSets)} sets come from secondary work.`);
      } else {
        console.log(`${MUSCLE_LABELS[dep.muscle]}: ${(dep.secondaryPct * 100).toFixed(0)}% of volume from secondary work (${dep.primarySets} direct, ${fmtFloat(dep.effectiveSets)} effective)`);
      }
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log('END OF CRITIQUE');
  console.log('='.repeat(60));
};

// ── Main ─────────────────────────────────────────────────────────────

const main = () => {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: npx tsx scripts/export-plan.ts <path-to-plan.json>');
    console.error('');
    console.error('Export your plan from the Sets Wallet app (Export button) or');
    console.error('extract it from the browser console:');
    console.error('  JSON.stringify(JSON.parse(localStorage.getItem("sets-wallet-state")), null, 2)');
    process.exit(1);
  }

  const resolved = resolve(filePath);
  let raw: string;
  try {
    raw = readFileSync(resolved, 'utf-8');
  } catch {
    console.error(`Could not read file: ${resolved}`);
    process.exit(1);
  }

  let state: AppState;
  try {
    state = JSON.parse(raw) as AppState;
  } catch {
    console.error('Invalid JSON in file.');
    process.exit(1);
  }

  if (!state.currentPlan || !state.musclePriorities || !state.exercises) {
    console.error('File does not look like a Sets Wallet state export. Expected keys: currentPlan, musclePriorities, exercises.');
    process.exit(1);
  }

  printReport(state);
};

main();
