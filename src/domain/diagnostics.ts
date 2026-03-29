import { DIAGNOSTICS_CONF } from '../data/diagnostics-conf';

const PUSH_MUSCLES: MuscleGroup[] = ['chest', 'shoulders', 'triceps'];
const PULL_MUSCLES: MuscleGroup[] = ['back', 'biceps'];

type DiagnosticCheck = (
  day: TrainingDay,
  exerciseMap: Map<string, Exercise>
) => DayDiagnostic | null;

const checkDuplicate: DiagnosticCheck = (day, exerciseMap) => {
  const seen = new Map<string, number>();
  for (const pe of day.exercises) {
    seen.set(pe.exerciseId, (seen.get(pe.exerciseId) ?? 0) + 1);
  }
  const dupes = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => exerciseMap.get(id)?.name ?? id);

  if (dupes.length === 0) return null;
  return {
    code: 'duplicate-exercise',
    severity: 'warning',
    message: `Duplicate: ${dupes.join(', ')}`,
  };
};

const checkTooManySets: DiagnosticCheck = (day) => {
  const total = day.exercises.reduce((s, e) => s + e.sets, 0);
  if (total <= DIAGNOSTICS_CONF.maxSetsPerDay) return null;
  return {
    code: 'too-many-sets',
    severity: 'warning',
    message: `${total} sets — consider splitting (>${DIAGNOSTICS_CONF.maxSetsPerDay})`,
  };
};

const checkTooFewSets: DiagnosticCheck = (day) => {
  if (day.exercises.length === 0) return null;
  const total = day.exercises.reduce((s, e) => s + e.sets, 0);
  if (total >= DIAGNOSTICS_CONF.minSetsPerDay) return null;
  return {
    code: 'too-few-sets',
    severity: 'info',
    message: `Only ${total} sets — room for more volume`,
  };
};

const checkMuscleOverload: DiagnosticCheck = (day, exerciseMap) => {
  const muscleCount = new Map<MuscleGroup, number>();
  for (const pe of day.exercises) {
    const ex = exerciseMap.get(pe.exerciseId);
    if (!ex) continue;
    muscleCount.set(ex.primary, (muscleCount.get(ex.primary) ?? 0) + 1);
  }
  const overloaded = [...muscleCount.entries()]
    .filter(([, count]) => count > DIAGNOSTICS_CONF.maxExercisesPerMuscle)
    .map(([muscle]) => muscle);

  if (overloaded.length === 0) return null;
  return {
    code: 'muscle-overload',
    severity: 'warning',
    message: `Too many exercises for: ${overloaded.join(', ')}`,
  };
};

const checkNoCompound: DiagnosticCheck = (day, exerciseMap) => {
  if (day.exercises.length < 3) return null;
  const hasCompound = day.exercises.some((pe) => {
    const ex = exerciseMap.get(pe.exerciseId);
    return ex && ex.secondary.length > 0;
  });
  if (hasCompound) return null;
  return {
    code: 'no-compound',
    severity: 'info',
    message: 'No compound movements — consider adding one',
  };
};

const checkPushPullImbalance: DiagnosticCheck = (day, exerciseMap) => {
  if (day.exercises.length < 4) return null;
  let push = 0;
  let pull = 0;
  for (const pe of day.exercises) {
    const ex = exerciseMap.get(pe.exerciseId);
    if (!ex) continue;
    if (PUSH_MUSCLES.includes(ex.primary)) push++;
    if (PULL_MUSCLES.includes(ex.primary)) pull++;
  }
  if (push === 0 && pull === 0) return null;
  if (push > 0 && pull > 0 && push / pull <= 2 && pull / push <= 2) return null;
  if (push > 0 && pull === 0) {
    return { code: 'push-pull-imbalance', severity: 'info', message: 'All push, no pull' };
  }
  if (pull > 0 && push === 0) {
    return { code: 'push-pull-imbalance', severity: 'info', message: 'All pull, no push' };
  }
  const ratio = push > pull ? `${push}:${pull} push/pull` : `${pull}:${push} pull/push`;
  return { code: 'push-pull-imbalance', severity: 'info', message: `Imbalanced: ${ratio}` };
};

const CHECKS: DiagnosticCheck[] = [
  checkDuplicate,
  checkTooManySets,
  checkTooFewSets,
  checkMuscleOverload,
  checkNoCompound,
  checkPushPullImbalance,
];

export const diagnoseDay = (
  day: TrainingDay,
  exerciseMap: Map<string, Exercise>
): DayDiagnostic[] =>
  CHECKS.map((check) => check(day, exerciseMap)).filter(Boolean) as DayDiagnostic[];
