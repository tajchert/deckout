import { useProfileStore } from '../store/profile-store';
import { useSelectedAction } from '../store/selectors';
import type { ActionConfig } from '../lib/types';
import { getKeyTable } from '../lib/keycodes';

const ACTION_TYPES = [
  { value: '', label: '— No Action —' },
  { value: 'hotkey', label: 'Hotkey (Keyboard Shortcut)' },
  { value: 'open', label: 'Open (App / File)' },
  { value: 'website', label: 'Website (URL)' },
  { value: 'text', label: 'Text (Type String)' },
  { value: 'media', label: 'Media Control' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'multi-action', label: 'Multi-Action (Sequence)' },
  { value: 'multi-action-toggle', label: 'Multi-Action Toggle' },
] as const;

function createDefaultAction(type: string, os: 'macos' | 'windows'): ActionConfig | null {
  const keys = getKeyTable(os);
  switch (type) {
    case 'hotkey':
      return { type: 'hotkey', title: '', modifiers: { cmd: false, ctrl: false, option: false, shift: false }, keyCode: keys[0] };
    case 'open':
      return { type: 'open', title: '', path: '' };
    case 'website':
      return { type: 'website', title: '', url: '' };
    case 'text':
      return { type: 'text', title: '', text: '', sendEnter: false };
    case 'media':
      return { type: 'media', title: 'Mute', mediaType: 'mute' };
    case 'navigation':
      return { type: 'navigation', title: '', navType: 'next-page' };
    case 'multi-action':
      return { type: 'multi-action', title: '', subActions: [] };
    case 'multi-action-toggle':
      return { type: 'multi-action-toggle', title: '', routine: [], routineAlt: [] };
    default:
      return null;
  }
}

export function ActionTypeSelector() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setAction = useProfileStore((s) => s.setAction);
  const clearAction = useProfileStore((s) => s.clearAction);
  const targetOS = useProfileStore((s) => s.targetOS);
  const action = useSelectedAction();

  const handleChange = (value: string) => {
    if (!selectedKey) return;
    if (!value) {
      clearAction(selectedKey);
      return;
    }
    const newAction = createDefaultAction(value, targetOS);
    if (newAction) {
      setAction(selectedKey, newAction);
    }
  };

  return (
    <div className="form-group">
      <label>Action Type</label>
      <select
        value={action?.type ?? ''}
        onChange={(e) => handleChange(e.target.value)}
      >
        {ACTION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}
