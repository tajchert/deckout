import { useProfileStore } from '../../store/profile-store';
import { useSelectedAction } from '../../store/selectors';
import type { ActionConfig } from '../../lib/types';

export function OpenForm() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setAction = useProfileStore((s) => s.setAction);
  const targetOS = useProfileStore((s) => s.targetOS);
  const action = useSelectedAction();

  if (!action || action.type !== 'open' || !selectedKey) return null;

  const update = (partial: Partial<Extract<ActionConfig, { type: 'open' }>>) => {
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
        <label>File / App Path</label>
        <input
          type="text"
          value={action.path}
          onChange={(e) => update({ path: e.target.value })}
          placeholder={targetOS === 'macos' ? '/Applications/Safari.app' : 'C:\\Program Files\\...'}
        />
      </div>
    </>
  );
}
