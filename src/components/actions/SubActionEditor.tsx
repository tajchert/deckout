import type { SubActionConfig, SimpleActionConfig, TargetOS } from '../../lib/types';
import { getKeyTable } from '../../lib/keycodes';

const SIMPLE_TYPES = [
  { value: 'hotkey', label: 'Hotkey' },
  { value: 'website', label: 'Website' },
  { value: 'open', label: 'Open' },
  { value: 'text', label: 'Text' },
  { value: 'media', label: 'Media' },
  { value: 'navigation', label: 'Navigation' },
] as const;

function createDefaultSimple(type: string, os: TargetOS): SimpleActionConfig {
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
    default:
      return { type: 'website', title: '', url: '' };
  }
}

interface SubActionEditorProps {
  sub: SubActionConfig;
  targetOS: TargetOS;
  onChange: (updated: SubActionConfig) => void;
  onRemove: () => void;
  index: number;
}

export function SubActionEditor({ sub, targetOS, onChange, onRemove, index }: SubActionEditorProps) {
  if (sub.type === 'delay') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '18px' }}>
          {index + 1}.
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Delay</span>
        <input
          type="number"
          value={sub.delayMs}
          onChange={(e) => onChange({ ...sub, delayMs: Math.max(0, parseInt(e.target.value) || 0) })}
          style={{ width: '80px', fontSize: '11px', padding: '3px 6px' }}
          min={0}
          step={100}
        />
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ms</span>
        <button className="btn-ghost" onClick={onRemove} style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px' }}>×</button>
      </div>
    );
  }

  const action = sub.action;

  const handleTypeChange = (newType: string) => {
    onChange({ ...sub, action: createDefaultSimple(newType, targetOS) });
  };

  const updateAction = (partial: Record<string, unknown>) => {
    onChange({ ...sub, action: { ...action, ...partial } as SimpleActionConfig });
  };

  return (
    <div style={{
      padding: '10px',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '18px' }}>
          {index + 1}.
        </span>
        <select
          value={action.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          style={{ flex: 1, fontSize: '11px', padding: '3px 6px' }}
        >
          {SIMPLE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button className="btn-ghost" onClick={onRemove} style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px' }}>×</button>
      </div>

      {action.type === 'website' && (
        <input
          type="url"
          value={action.url}
          onChange={(e) => updateAction({ url: e.target.value, title: action.title || e.target.value })}
          placeholder="https://..."
          style={{ fontSize: '11px', padding: '3px 6px' }}
        />
      )}
      {action.type === 'open' && (
        <input
          type="text"
          value={action.path}
          onChange={(e) => updateAction({ path: e.target.value, title: action.title || e.target.value })}
          placeholder="/Applications/..."
          style={{ fontSize: '11px', padding: '3px 6px' }}
        />
      )}
      {action.type === 'text' && (
        <input
          type="text"
          value={action.text}
          onChange={(e) => updateAction({ text: e.target.value, title: action.title || 'Text' })}
          placeholder="Text to type..."
          style={{ fontSize: '11px', padding: '3px 6px' }}
        />
      )}
      {action.type === 'hotkey' && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Key: {action.keyCode.name}
          {action.modifiers.cmd && ' +⌘'}
          {action.modifiers.ctrl && ' +⌃'}
          {action.modifiers.option && ' +⌥'}
          {action.modifiers.shift && ' +⇧'}
        </div>
      )}
    </div>
  );
}
