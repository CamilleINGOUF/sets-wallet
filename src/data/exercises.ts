const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const ex = (name: string, primary: MuscleGroup, secondary: MuscleGroup[] = []): Exercise => ({
  id: `preset-${slug(name)}`,
  name,
  primary,
  secondary,
});

export const PRESET_EXERCISES: Exercise[] = [
  // Chest
  ex('Bench Press', 'chest', ['triceps', 'shoulders']),
  ex('Incline Bench Press', 'chest', ['triceps', 'shoulders']),
  ex('Dumbbell Flyes', 'chest'),
  ex('Cable Crossover', 'chest'),
  ex('Dips (Chest)', 'chest', ['triceps']),
  ex('Push-Ups', 'chest', ['triceps', 'shoulders']),

  // Back
  ex('Pull-Ups', 'back', ['biceps']),
  ex('Barbell Row', 'back', ['biceps']),
  ex('Lat Pulldown', 'back', ['biceps']),
  ex('Close-Grip Supinated Pulldown', 'back', ['biceps']),
  ex('Seated Cable Row', 'back', ['biceps']),
  ex('T-Bar Row', 'back', ['biceps']),
  ex('Face Pulls', 'back', ['shoulders']),
  ex('Deadlift', 'back', ['hamstrings', 'glutes']),

  // Shoulders
  ex('Overhead Press', 'shoulders', ['triceps']),
  ex('Lateral Raises', 'shoulders'),
  ex('Front Raises', 'shoulders'),
  ex('Reverse Flyes', 'shoulders', ['back']),
  ex('Arnold Press', 'shoulders', ['triceps']),

  // Biceps
  ex('Barbell Curl', 'biceps'),
  ex('Dumbbell Curl', 'biceps'),
  ex('Hammer Curl', 'biceps', ['forearms']),
  ex('Incline Curl', 'biceps'),
  ex('Preacher Curl', 'biceps'),
  ex('Cable Curl', 'biceps'),

  // Triceps
  ex('Tricep Pushdown', 'triceps'),
  ex('Skull Crushers', 'triceps'),
  ex('Overhead Tricep Extension', 'triceps'),
  ex('Close-Grip Bench', 'triceps', ['chest']),
  ex('Dips (Triceps)', 'triceps', ['chest']),

  // Quads
  ex('Squat', 'quads', ['glutes']),
  ex('Leg Press', 'quads', ['glutes']),
  ex('Leg Extension', 'quads'),
  ex('Front Squat', 'quads', ['glutes', 'abs']),
  ex('Hack Squat', 'quads', ['glutes']),
  ex('Lunges', 'quads', ['glutes', 'hamstrings']),

  // Hamstrings
  ex('Romanian Deadlift', 'hamstrings', ['glutes', 'back']),
  ex('Leg Curl', 'hamstrings'),
  ex('Nordic Curl', 'hamstrings'),
  ex('Good Morning', 'hamstrings', ['back', 'glutes']),

  // Glutes
  ex('Hip Thrust', 'glutes', ['hamstrings']),
  ex('Cable Kickback', 'glutes'),
  ex('Glute Bridge', 'glutes', ['hamstrings']),
  ex('Bulgarian Split Squat', 'glutes', ['quads']),

  // Calves
  ex('Standing Calf Raise', 'calves'),
  ex('Seated Calf Raise', 'calves'),

  // Abs
  ex('Cable Crunch', 'abs'),
  ex('Hanging Leg Raise', 'abs'),
  ex('Ab Wheel', 'abs'),
  ex('Plank', 'abs'),

  // Forearms
  ex('Wrist Curl', 'forearms'),
  ex('Reverse Wrist Curl', 'forearms'),
  ex('Farmer Walk', 'forearms', ['abs']),
];
