import { TEMPLATES } from '../data/templates';
import { actions, isDirty } from '../store/useStore';

export const TemplatePicker: React.FC = () => {
  const handlePick = (templateId: string) => {
    if (isDirty() && !window.confirm('This will replace your current plan. Continue?')) return;
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (tpl) actions.loadTemplate(tpl.build());
  };

  return (
    <div className="template-picker">
      <h3>Start from a template</h3>
      <div className="template-grid">
        {TEMPLATES.map((t) => (
          <button key={t.id} className="template-card" onClick={() => handlePick(t.id)}>
            <span className="template-name">{t.name}</span>
            <span className="template-desc">{t.description}</span>
            <span className="template-days">{t.days} days/week</span>
          </button>
        ))}
      </div>
    </div>
  );
};
