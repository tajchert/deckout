import { useProfileStore } from '../../store/profile-store';
import { useSelectedAction } from '../../store/selectors';
import type { ActionConfig, NavigationType } from '../../lib/types';

const NAV_OPTIONS: { value: NavigationType; label: string; needsUuid: boolean }[] = [
  { value: 'next-page', label: 'Next Page', needsUuid: false },
  { value: 'previous-page', label: 'Previous Page', needsUuid: false },
  { value: 'back-to-parent', label: 'Back to Parent', needsUuid: false },
  { value: 'switch-profile', label: 'Switch Profile', needsUuid: true },
  { value: 'open-folder', label: 'Open Folder', needsUuid: true },
];

export function NavigationForm() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setAction = useProfileStore((s) => s.setAction);
  const action = useSelectedAction();

  if (!action || action.type !== 'navigation' || !selectedKey) return null;

  const update = (partial: Partial<Extract<ActionConfig, { type: 'navigation' }>>) => {
    setAction(selectedKey, { ...action, ...partial });
  };

  const currentOpt = NAV_OPTIONS.find((o) => o.value === action.navType);

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
        <label>Navigation Type</label>
        <select
          value={action.navType}
          onChange={(e) => {
            const navType = e.target.value as NavigationType;
            const opt = NAV_OPTIONS.find((o) => o.value === navType);
            update({ navType, title: action.title || opt?.label || '', profileUuid: undefined });
          }}
        >
          {NAV_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {currentOpt?.needsUuid && (
        <div className="form-group">
          <label>Profile UUID</label>
          <input
            type="text"
            value={action.profileUuid ?? ''}
            onChange={(e) => update({ profileUuid: e.target.value })}
            placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          />
        </div>
      )}
    </>
  );
}
