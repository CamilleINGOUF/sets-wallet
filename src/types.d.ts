type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'forearms';

type Priority = 'priority' | 'moderate' | 'maintenance';

type SetRange = {
  min: number;
  max: number;
};

type MuscleConfig = {
  muscle: MuscleGroup;
  priority: Priority;
};

type Exercise = {
  id: string;
  name: string;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
};

type SupersetGroup = 'A' | 'B' | 'C' | 'D' | 'E';

type PlannedExercise = {
  uid: string;
  exerciseId: string;
  sets: number;
  superset?: SupersetGroup;
};

type TrainingDay = {
  id: string;
  label: string;
  exercises: PlannedExercise[];
};

type WeeklyPlan = {
  id: string;
  name: string;
  createdAt: string;
  days: TrainingDay[];
};

type MuscleVolume = {
  muscle: MuscleGroup;
  priority: Priority;
  target: SetRange;
  primarySets: number;
  secondarySets: number;
  effectiveSets: number;
  status: 'under' | 'on-target' | 'over';
};

type DiagnosticSeverity = 'warning' | 'info';

type DiagnosticCode =
  | 'duplicate-exercise'
  | 'too-many-sets'
  | 'too-few-sets'
  | 'muscle-overload'
  | 'no-compound'
  | 'push-pull-imbalance';

type DayDiagnostic = {
  code: DiagnosticCode;
  severity: DiagnosticSeverity;
  message: string;
};

type MuscleGap = {
  muscle: MuscleGroup;
  gap: number;
  priority: Priority;
};

type ExerciseScore = {
  exerciseId: string;
  score: number;
  suggestedSets: number;
  primaryGap: number;
};

type PriorityRanges = Record<Priority, SetRange>;

type AppState = {
  musclePriorities: MuscleConfig[];
  priorityRanges: PriorityRanges;
  exercises: Exercise[];
  currentPlan: WeeklyPlan;
  savedPlans: WeeklyPlan[];
  secondaryWeight: number;
};

type ProfileMeta = {
  id: string;
  name: string;
};

type ProfilesIndex = {
  activeId: string;
  profiles: ProfileMeta[];
};
