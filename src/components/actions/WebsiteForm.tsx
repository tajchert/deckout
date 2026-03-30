import { useProfileStore } from '../../store/profile-store';
import { useSelectedAction } from '../../store/selectors';
import type { ActionConfig } from '../../lib/types';

export function WebsiteForm() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setAction = useProfileStore((s) => s.setAction);
  const action = useSelectedAction();

  if (!action || action.type !== 'website' || !selectedKey) return null;

  const update = (partial: Partial<Extract<ActionConfig, { type: 'website' }>>) => {
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
        <label>URL</label>
        <input
          type="url"
          value={action.url}
          onChange={(e) => update({ url: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </>
  );
}
