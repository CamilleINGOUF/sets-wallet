const pe = (exerciseId: string, sets: number): PlannedExercise => ({
  uid: crypto.randomUUID(),
  exerciseId: `preset-${exerciseId}`,
  sets,
});

const day = (id: string, label: string, exercises: PlannedExercise[]): TrainingDay => ({
  id,
  label,
  exercises,
});

type TemplateDescriptor = {
  id: string;
  name: string;
  description: string;
  days: number;
  build: () => TrainingDay[];
};

export const TEMPLATES: TemplateDescriptor[] = [
  {
    id: 'ppl-6',
    name: 'Push / Pull / Legs (6-day)',
    description: '2x frequency, high volume',
    days: 6,
    build: () => [
      day('push1', 'Push A', [
        pe('bench-press', 4),
        pe('overhead-press', 3),
        pe('incline-bench-press', 3),
        pe('lateral-raises', 3),
        pe('tricep-pushdown', 3),
        pe('overhead-tricep-extension', 2),
      ]),
      day('pull1', 'Pull A', [
        pe('barbell-row', 4),
        pe('pull-ups', 3),
        pe('seated-cable-row', 3),
        pe('face-pulls', 3),
        pe('barbell-curl', 3),
        pe('hammer-curl', 2),
      ]),
      day('legs1', 'Legs A', [
        pe('squat', 4),
        pe('romanian-deadlift', 3),
        pe('leg-press', 3),
        pe('leg-curl', 3),
        pe('standing-calf-raise', 3),
        pe('cable-crunch', 3),
      ]),
      day('push2', 'Push B', [
        pe('overhead-press', 4),
        pe('bench-press', 3),
        pe('dumbbell-flyes', 3),
        pe('lateral-raises', 3),
        pe('skull-crushers', 3),
        pe('dips--triceps-', 2),
      ]),
      day('pull2', 'Pull B', [
        pe('lat-pulldown', 4),
        pe('t-bar-row', 3),
        pe('close-grip-supinated-pulldown', 3),
        pe('reverse-flyes', 3),
        pe('dumbbell-curl', 3),
        pe('preacher-curl', 2),
      ]),
      day('legs2', 'Legs B', [
        pe('front-squat', 4),
        pe('hip-thrust', 3),
        pe('hack-squat', 3),
        pe('leg-curl', 3),
        pe('seated-calf-raise', 3),
        pe('hanging-leg-raise', 3),
      ]),
    ],
  },
  {
    id: 'ppl-3',
    name: 'Push / Pull / Legs (3-day)',
    description: '1x frequency, compact',
    days: 3,
    build: () => [
      day('push', 'Push', [
        pe('bench-press', 4),
        pe('overhead-press', 3),
        pe('incline-bench-press', 3),
        pe('lateral-raises', 3),
        pe('tricep-pushdown', 3),
      ]),
      day('pull', 'Pull', [
        pe('barbell-row', 4),
        pe('pull-ups', 3),
        pe('seated-cable-row', 3),
        pe('face-pulls', 3),
        pe('barbell-curl', 3),
      ]),
      day('legs', 'Legs', [
        pe('squat', 4),
        pe('romanian-deadlift', 3),
        pe('leg-press', 3),
        pe('leg-curl', 3),
        pe('standing-calf-raise', 3),
      ]),
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower (4-day)',
    description: '2x frequency, balanced',
    days: 4,
    build: () => [
      day('upper1', 'Upper A', [
        pe('bench-press', 4),
        pe('barbell-row', 4),
        pe('overhead-press', 3),
        pe('lat-pulldown', 3),
        pe('lateral-raises', 3),
        pe('barbell-curl', 2),
        pe('tricep-pushdown', 2),
      ]),
      day('lower1', 'Lower A', [
        pe('squat', 4),
        pe('romanian-deadlift', 3),
        pe('leg-press', 3),
        pe('leg-curl', 3),
        pe('standing-calf-raise', 3),
        pe('cable-crunch', 3),
      ]),
      day('upper2', 'Upper B', [
        pe('incline-bench-press', 4),
        pe('t-bar-row', 4),
        pe('arnold-press', 3),
        pe('seated-cable-row', 3),
        pe('face-pulls', 3),
        pe('hammer-curl', 2),
        pe('skull-crushers', 2),
      ]),
      day('lower2', 'Lower B', [
        pe('front-squat', 4),
        pe('hip-thrust', 3),
        pe('hack-squat', 3),
        pe('leg-curl', 3),
        pe('seated-calf-raise', 3),
        pe('hanging-leg-raise', 3),
      ]),
    ],
  },
  {
    id: 'full-body-3',
    name: 'Full Body (3-day)',
    description: 'Minimalist, compound-focused',
    days: 3,
    build: () => [
      day('fb1', 'Full Body A', [
        pe('squat', 4),
        pe('bench-press', 4),
        pe('barbell-row', 4),
        pe('lateral-raises', 3),
        pe('barbell-curl', 2),
      ]),
      day('fb2', 'Full Body B', [
        pe('deadlift', 3),
        pe('overhead-press', 4),
        pe('pull-ups', 4),
        pe('leg-curl', 3),
        pe('tricep-pushdown', 2),
      ]),
      day('fb3', 'Full Body C', [
        pe('front-squat', 4),
        pe('incline-bench-press', 4),
        pe('seated-cable-row', 4),
        pe('hip-thrust', 3),
        pe('standing-calf-raise', 3),
      ]),
    ],
  },
  {
    id: 'bro-split',
    name: 'Bro Split (5-day)',
    description: 'One muscle group per day',
    days: 5,
    build: () => [
      day('chest', 'Chest', [
        pe('bench-press', 4),
        pe('incline-bench-press', 4),
        pe('dumbbell-flyes', 3),
        pe('cable-crossover', 3),
        pe('dips--chest-', 3),
      ]),
      day('back', 'Back', [
        pe('deadlift', 3),
        pe('barbell-row', 4),
        pe('pull-ups', 3),
        pe('seated-cable-row', 3),
        pe('face-pulls', 3),
      ]),
      day('shoulders', 'Shoulders & Abs', [
        pe('overhead-press', 4),
        pe('lateral-raises', 4),
        pe('reverse-flyes', 3),
        pe('arnold-press', 3),
        pe('cable-crunch', 3),
        pe('hanging-leg-raise', 3),
      ]),
      day('arms', 'Arms', [
        pe('barbell-curl', 3),
        pe('skull-crushers', 3),
        pe('hammer-curl', 3),
        pe('tricep-pushdown', 3),
        pe('preacher-curl', 3),
        pe('overhead-tricep-extension', 3),
      ]),
      day('legs', 'Legs', [
        pe('squat', 4),
        pe('romanian-deadlift', 3),
        pe('leg-press', 3),
        pe('leg-curl', 3),
        pe('standing-calf-raise', 3),
      ]),
    ],
  },
];
