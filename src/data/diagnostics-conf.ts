export const DIAGNOSTICS_CONF = {
  maxSetsPerDay: 30,
  minSetsPerDay: 10,
  maxExercisesPerMuscle: 3,
} as const;

export const SEVERITY_STYLES: Record<DiagnosticSeverity, { icon: string; className: string }> = {
  warning: { icon: '!', className: 'diag-warning' },
  info: { icon: 'i', className: 'diag-info' },
};
