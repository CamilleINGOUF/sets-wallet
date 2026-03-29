import { SEVERITY_STYLES } from '../data/diagnostics-conf';

export const DayDiagnostics: React.FC<{ diagnostics: DayDiagnostic[] }> = ({
  diagnostics,
}) => {
  if (diagnostics.length === 0) return null;

  return (
    <div className="day-diagnostics">
      {diagnostics.map((d) => {
        const style = SEVERITY_STYLES[d.severity];
        return (
          <div key={d.code} className={`diag-pill ${style.className}`}>
            <span className="diag-icon">{style.icon}</span>
            <span>{d.message}</span>
          </div>
        );
      })}
    </div>
  );
};
