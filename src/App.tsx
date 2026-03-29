import { useState, useEffect } from 'react';
import { VolumeDashboard } from './components/VolumeDashboard';
import { PriorityEditor } from './components/PriorityEditor';
import { WeekPlanner } from './components/WeekPlanner';
import { SavedPlans } from './components/SavedPlans';
import { isDirty } from './store/useStore';
import { ProfileSwitcher } from './components/ProfileSwitcher';

const TABS = ['Plan', 'Priorities', 'Volume', 'History'] as const;
type Tab = (typeof TABS)[number];

const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('Plan');

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Sets Wallet</h1>
        <ProfileSwitcher />
        <nav>
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {tab === 'Plan' && <WeekPlanner />}
        {tab === 'Priorities' && <PriorityEditor />}
        {tab === 'Volume' && <VolumeDashboard />}
        {tab === 'History' && <SavedPlans />}
      </main>
    </div>
  );
};

export default App;
