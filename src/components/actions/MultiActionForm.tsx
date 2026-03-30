import { useProfileStore } from '../../store/profile-store';
import { useSelectedAction } from '../../store/selectors';
import { SubActionEditor } from './SubActionEditor';
import { generateUuid } from '../../lib/uuid';
import type { SubActionConfig } from '../../lib/types';

export function MultiActionForm() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setAction = useProfileStore((s) => s.setAction);
  const targetOS = useProfileStore((s) => s.targetOS);
  const action = useSelectedAction();

  if (!action || action.type !== 'multi-action' || !selectedKey) return null;

  const updateSubs = (subActions: SubActionConfig[]) => {
    setAction(selectedKey, { ...action, subActions });
  };

  const addAction = () => {
    updateSubs([
      ...action.subActions,
      { id: generateUuid(), type: 'action', action: { type: 'website', title: '', url: '' } },
    ]);
  };

  const addDelay = () => {
    updateSubs([
      ...action.subActions,
      { id: generateUuid(), type: 'delay', delayMs: 500 },
    ]);
  };

  const handleChange = (index: number, updated: SubActionConfig) => {
    const subs = [...action.subActions];
    subs[index] = updated;
    updateSubs(subs);
  };

  const handleRemove = (index: number) => {
    updateSubs(action.subActions.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={action.title}
          onChange={(e) => setAction(selectedKey, { ...action, title: e.target.value })}
          placeholder="Button label..."
        />
      </div>

      <div className="form-group">
        <label>Actions ({action.subActions.length})</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {action.subActions.map((sub, i) => (
            <SubActionEditor
              key={sub.id}
              sub={sub}
              targetOS={targetOS}
              onChange={(updated) => handleChange(i, updated)}
              onRemove={() => handleRemove(i)}
              index={i}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={addAction} style={{ flex: 1, fontSize: '11px', padding: '6px' }}>
          + Action
        </button>
        <button onClick={addDelay} style={{ flex: 1, fontSize: '11px', padding: '6px' }}>
          + Delay
        </button>
      </div>
    </>
  );
}
