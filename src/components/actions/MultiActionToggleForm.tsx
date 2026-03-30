import { useState } from 'react';
import { useProfileStore } from '../../store/profile-store';
import { useSelectedAction } from '../../store/selectors';
import { SubActionEditor } from './SubActionEditor';
import { generateUuid } from '../../lib/uuid';
import type { SubActionConfig } from '../../lib/types';

export function MultiActionToggleForm() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setAction = useProfileStore((s) => s.setAction);
  const targetOS = useProfileStore((s) => s.targetOS);
  const action = useSelectedAction();
  const [activeTab, setActiveTab] = useState<'routine' | 'routineAlt'>('routine');

  if (!action || action.type !== 'multi-action-toggle' || !selectedKey) return null;

  const currentList = activeTab === 'routine' ? action.routine : action.routineAlt;

  const updateList = (list: SubActionConfig[]) => {
    setAction(selectedKey, { ...action, [activeTab]: list });
  };

  const addAction = () => {
    updateList([
      ...currentList,
      { id: generateUuid(), type: 'action', action: { type: 'website', title: '', url: '' } },
    ]);
  };

  const addDelay = () => {
    updateList([
      ...currentList,
      { id: generateUuid(), type: 'delay', delayMs: 500 },
    ]);
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

      <div style={{
        display: 'flex',
        gap: '2px',
        marginBottom: '12px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}>
        {(['routine', 'routineAlt'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 0,
              padding: '6px',
              fontSize: '11px',
              background: activeTab === tab ? 'var(--accent)' : 'transparent',
              color: activeTab === tab ? '#000' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 500 : 400,
            }}
          >
            {tab === 'routine' ? 'State 0 (Primary)' : 'State 1 (Alternate)'}
          </button>
        ))}
      </div>

      <div className="form-group">
        <label>{activeTab === 'routine' ? 'Primary' : 'Alternate'} Actions ({currentList.length})</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {currentList.map((sub, i) => (
            <SubActionEditor
              key={sub.id}
              sub={sub}
              targetOS={targetOS}
              onChange={(updated) => {
                const list = [...currentList];
                list[i] = updated;
                updateList(list);
              }}
              onRemove={() => updateList(currentList.filter((_, idx) => idx !== i))}
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
