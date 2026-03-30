import { useProfileStore } from '../../store/profile-store';
import { useSelectedAction } from '../../store/selectors';
import type { ActionConfig } from '../../lib/types';

export function TextForm() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setAction = useProfileStore((s) => s.setAction);
  const action = useSelectedAction();

  if (!action || action.type !== 'text' || !selectedKey) return null;

  const update = (partial: Partial<Extract<ActionConfig, { type: 'text' }>>) => {
    setAction(selectedKey, { ...action, ...partial });
  };

  return (
    <>
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={action.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Button label..."
        />
      </div>
      <div className="form-group">
        <label>Text to type</label>
        <textarea
          value={action.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Text that will be typed..."
          rows={4}
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="checkbox-row">
        <input
          type="checkbox"
          id="sendEnter"
          checked={action.sendEnter}
          onChange={(e) => update({ sendEnter: e.target.checked })}
        />
        <label htmlFor="sendEnter">Send Enter after typing</label>
      </div>
    </>
  );
}
