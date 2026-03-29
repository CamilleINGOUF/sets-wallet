import { describe, it, expect } from 'vitest';
import { computeGaps, scoreExercises, sortMusclesByGap, getTopSuggestions } from './suggestions';

const mkVolume = (
  muscle: MuscleGroup,
  effectiveSets: number,
  min: number,
  max: number,
  priority: Priority = 'moderate'
): MuscleVolume => ({
  muscle,
  priority,
  target: { min, max },
  primarySets: effectiveSets,
  secondarySets: 0,
  effectiveSets,
  status: effectiveSets < min ? 'under' : effectiveSets > max ? 'over' : 'on-target',
});

const mkExercise = (id: string, primary: MuscleGroup, secondary: MuscleGroup[] = []): Exercise => ({
  id,
  name: id,
  primary,
  secondary,
});

describe('computeGaps', () => {
  it('returns positive gap for under-target muscles', () => {
    const volumes = [mkVolume('back', 10, 15, 18)];
    const gaps = computeGaps(volumes);
    expect(gaps).toEqual([{ muscle: 'back', gap: 5, priority: 'moderate' }]);
  });

  it('returns negative gap for over-target muscles', () => {
    const volumes = [mkVolume('chest', 20, 15, 18)];
    const gaps = computeGaps(volumes);
    expect(gaps[0].gap).toBe(-5);
  });

  it('returns zero gap when exactly at min', () => {
    const volumes = [mkVolume('shoulders', 12, 12, 16)];
    const gaps = computeGaps(volumes);
    expect(gaps[0].gap).toBe(0);
  });

  it('returns negative gap when within range but above min', () => {
    const volumes = [mkVolume('biceps', 14, 12, 16)];
    const gaps = computeGaps(volumes);
    expect(gaps[0].gap).toBe(-2);
  });
});

describe('scoreExercises', () => {
  const gaps: MuscleGap[] = [
    { muscle: 'back', gap: 5, priority: 'priority' },
    { muscle: 'biceps', gap: 3, priority: 'moderate' },
    { muscle: 'chest', gap: -2, priority: 'maintenance' },
  ];

  it('scores compound exercise higher than isolation when filling multiple gaps', () => {
    const row = mkExercise('row', 'back', ['biceps']);
    const pulldown = mkExercise('pulldown', 'back');
    const scores = scoreExercises([row, pulldown], gaps, 0.5);

    const rowScore = scores.find((s) => s.exerciseId === 'row')!;
    const pulldownScore = scores.find((s) => s.exerciseId === 'pulldown')!;
    expect(rowScore.score).toBeGreaterThan(pulldownScore.score);
  });

  it('returns score 0 for exercises targeting only on-target/over muscles', () => {
    const benchPress = mkExercise('bench', 'chest');
    const scores = scoreExercises([benchPress], gaps, 0.5);
    expect(scores[0].score).toBe(0);
  });

  it('computes correct score: primaryGap + secondaryGapSum * weight', () => {
    const row = mkExercise('row', 'back', ['biceps']);
    const scores = scoreExercises([row], gaps, 0.5);
    expect(scores[0].score).toBe(5 + 3 * 0.5);
  });

  it('suggests sets based on primary gap, clamped to [1, 5]', () => {
    const exercises = [
      mkExercise('a', 'back'),   // gap = 5 → suggested = 5 (clamped)
      mkExercise('b', 'biceps'), // gap = 3 → suggested = 3
    ];
    const scores = scoreExercises(exercises, gaps, 0.5);
    expect(scores.find((s) => s.exerciseId === 'a')!.suggestedSets).toBe(5);
    expect(scores.find((s) => s.exerciseId === 'b')!.suggestedSets).toBe(3);
  });

  it('defaults to 3 sets when primary muscle has no gap', () => {
    const bench = mkExercise('bench', 'chest');
    const scores = scoreExercises([bench], gaps, 0.5);
    expect(scores[0].suggestedSets).toBe(3);
  });

  it('clamps suggested sets to min 1 for small gaps', () => {
    const smallGaps: MuscleGap[] = [{ muscle: 'abs', gap: 0.3, priority: 'maintenance' }];
    const crunch = mkExercise('crunch', 'abs');
    const scores = scoreExercises([crunch], smallGaps, 0.5);
    expect(scores[0].suggestedSets).toBe(1);
  });
});

describe('sortMusclesByGap', () => {
  it('puts biggest deficit first', () => {
    const gaps: MuscleGap[] = [
      { muscle: 'chest', gap: -2, priority: 'maintenance' },
      { muscle: 'back', gap: 5, priority: 'priority' },
      { muscle: 'biceps', gap: 3, priority: 'moderate' },
    ];
    const sorted = sortMusclesByGap(gaps);
    expect(sorted.map((g) => g.muscle)).toEqual(['back', 'biceps', 'chest']);
  });

  it('does not mutate the input', () => {
    const gaps: MuscleGap[] = [
      { muscle: 'chest', gap: 1, priority: 'moderate' },
      { muscle: 'back', gap: 5, priority: 'priority' },
    ];
    const original = [...gaps];
    sortMusclesByGap(gaps);
    expect(gaps).toEqual(original);
  });
});

describe('getTopSuggestions', () => {
  it('returns at most N results sorted by score', () => {
    const scores: ExerciseScore[] = Array.from({ length: 10 }, (_, i) => ({
      exerciseId: `ex-${i}`,
      score: i + 1,
      suggestedSets: 3,
      primaryGap: i + 1,
    }));
    const top = getTopSuggestions(scores, 5);
    expect(top).toHaveLength(5);
    expect(top[0].exerciseId).toBe('ex-9');
    expect(top[4].exerciseId).toBe('ex-5');
  });

  it('excludes zero-score exercises', () => {
    const scores: ExerciseScore[] = [
      { exerciseId: 'a', score: 5, suggestedSets: 3, primaryGap: 5 },
      { exerciseId: 'b', score: 0, suggestedSets: 3, primaryGap: 0 },
    ];
    const top = getTopSuggestions(scores);
    expect(top).toHaveLength(1);
    expect(top[0].exerciseId).toBe('a');
  });

  it('returns empty array when all scores are zero', () => {
    const scores: ExerciseScore[] = [
      { exerciseId: 'a', score: 0, suggestedSets: 3, primaryGap: 0 },
    ];
    expect(getTopSuggestions(scores)).toEqual([]);
  });
});
