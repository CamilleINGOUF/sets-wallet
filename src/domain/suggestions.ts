import { SUGGESTIONS_CONF } from '../data/suggestions-conf';

export const computeGaps = (volumes: MuscleVolume[]): MuscleGap[] =>
  volumes.map((v) => ({
    muscle: v.muscle,
    gap: v.target.min - v.effectiveSets,
    priority: v.priority,
  }));

export const scoreExercises = (
  exercises: Exercise[],
  gaps: MuscleGap[],
  secondaryWeight: number
): ExerciseScore[] => {
  const gapMap = new Map(gaps.map((g) => [g.muscle, g.gap]));

  return exercises.map((ex) => {
    const primaryGap = Math.max(0, gapMap.get(ex.primary) ?? 0);
    const secondaryGapSum = ex.secondary.reduce(
      (sum, m) => sum + Math.max(0, gapMap.get(m) ?? 0),
      0
    );
    const score = primaryGap + secondaryGapSum * secondaryWeight;

    const rawSuggested = Math.round(primaryGap);
    const suggestedSets =
      primaryGap > 0
        ? Math.max(SUGGESTIONS_CONF.suggestedSetsMin, Math.min(SUGGESTIONS_CONF.suggestedSetsMax, rawSuggested))
        : SUGGESTIONS_CONF.defaultSets;

    return { exerciseId: ex.id, score, suggestedSets, primaryGap };
  });
};

export const sortMusclesByGap = (gaps: MuscleGap[]): MuscleGap[] =>
  [...gaps].sort((a, b) => b.gap - a.gap);

export const getTopSuggestions = (
  scores: ExerciseScore[],
  count: number = SUGGESTIONS_CONF.suggestionCount
): ExerciseScore[] =>
  [...scores]
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
