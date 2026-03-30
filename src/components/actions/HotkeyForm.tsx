import { useProfileStore } from '../../store/profile-store';
import { useSelectedAction } from '../../store/selectors';
import { getKeyTable } from '../../lib/keycodes';
import type { ActionConfig, ModifierFlags } from '../../lib/types';

export function HotkeyForm() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setAction = useProfileStore((s) => s.setAction);
  const targetOS = useProfileStore((s) => s.targetOS);
  const action = useSelectedAction();

  if (!action || action.type !== 'hotkey' || !selectedKey) return null;

  const keys = getKeyTable(targetOS);

  const update = (partial: Partial<Extract<ActionConfig, { type: 'hotkey' }>>) => {
    setAction(selectedKey, { ...action, ...partial });
  };

  const toggleMod = (mod: keyof ModifierFlags) => {
    update({ modifiers: { ...action.modifiers, [mod]: !action.modifiers[mod] } });
  };

  const handleKeyChange = (name: string) => {
    const entry = keys.find((k) => k.name === name);
    if (entry) update({ keyCode: entry });
  };

  const modifiers = targetOS === 'macos'
    ? [
        { key: 'cmd' as const, label: '⌘ Cmd' },
        { key: 'ctrl' as const, label: '⌃ Ctrl' },
        { key: 'option' as const, label: '⌥ Option' },
        { key: 'shift' as const, label: '⇧ Shift' },
      ]
    : [
        { key: 'ctrl' as const, label: 'Ctrl' },
        { key: 'shift' as const, label: 'Shift' },
        { key: 'option' as const, label: 'Alt' },
        { key: 'cmd' as const, label: 'Win' },
      ];

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
        <label>Modifiers</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {modifiers.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleMod(m.key)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                background: action.modifiers[m.key] ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: action.modifiers[m.key] ? '#000' : 'var(--text-secondary)',
                borderColor: action.modifiers[m.key] ? 'var(--accent)' : 'var(--border)',
                fontWeight: action.modifiers[m.key] ? 500 : 400,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Key</label>
        <select
          value={action.keyCode.name}
          onChange={(e) => handleKeyChange(e.target.value)}
        >
          {keys.map((k) => (
            <option key={k.name} value={k.name}>{k.name}</option>
          ))}
        </select>
      </div>

      <div style={{
        marginTop: '12px',
        padding: '10px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Preview: </span>
        {[
          action.modifiers.cmd && (targetOS === 'macos' ? '⌘' : 'Win'),
          action.modifiers.ctrl && (targetOS === 'macos' ? '⌃' : 'Ctrl'),
          action.modifiers.option && (targetOS === 'macos' ? '⌥' : 'Alt'),
          action.modifiers.shift && (targetOS === 'macos' ? '⇧' : 'Shift'),
          action.keyCode.name,
        ].filter(Boolean).join(' + ')}
      </div>
    </>
  );
}
