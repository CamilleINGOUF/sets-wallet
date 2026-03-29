import { useState } from 'react';
import { useProfiles, profileActions, isDirty } from '../store/useStore';

export const ProfileSwitcher: React.FC = () => {
  const { activeId, profiles } = useProfiles();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSwitch = (id: string) => {
    if (id === activeId) return;
    if (isDirty() && !window.confirm('You have unsaved changes. Switch profile anyway?')) return;
    profileActions.switchProfile(id);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = profileActions.createProfile(newName.trim());
    setNewName('');
    setAdding(false);
    profileActions.switchProfile(id);
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    profileActions.renameProfile(id, editName.trim());
    setEditing(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete profile "${name}" and all its plans? This cannot be undone.`)) {
      profileActions.deleteProfile(id);
    }
  };

  return (
    <div className="profile-switcher">
      {profiles.map((p) => (
        <div key={p.id} className="profile-chip-wrapper">
          {editing === p.id ? (
            <form
              className="profile-edit-form"
              onSubmit={(e) => { e.preventDefault(); handleRename(p.id); }}
            >
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                className="profile-edit-input"
              />
              <button type="submit" className="profile-edit-ok">ok</button>
              <button type="button" className="profile-edit-cancel" onClick={() => setEditing(null)}>×</button>
            </form>
          ) : (
            <button
              className={`profile-chip ${p.id === activeId ? 'profile-active' : ''}`}
              onClick={() => handleSwitch(p.id)}
              onDoubleClick={() => { setEditing(p.id); setEditName(p.name); }}
              title="Click to switch, double-click to rename"
            >
              {p.name}
            </button>
          )}
          {profiles.length > 1 && p.id !== activeId && (
            <button
              className="profile-delete"
              onClick={() => handleDelete(p.id, p.name)}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {adding ? (
        <form
          className="profile-add-form"
          onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name..."
            autoFocus
            className="profile-add-input"
          />
          <button type="submit" className="profile-add-ok">+</button>
          <button type="button" className="profile-add-cancel" onClick={() => setAdding(false)}>×</button>
        </form>
      ) : (
        <button className="profile-add-btn" onClick={() => setAdding(true)}>
          +
        </button>
      )}
    </div>
  );
};
