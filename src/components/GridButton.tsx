import type { ActionConfig } from '../lib/types';

const ACTION_LABELS: Record<string, string> = {
  hotkey: '⌨',
  open: '📂',
  website: '🌐',
  text: 'Aa',
  'multi-action': '▶▶',
  'multi-action-toggle': '⇄',
  navigation: '↩',
  media: '♪',
};

interface GridButtonProps {
  coordKey: string;
  col: number;
  row: number;
  action: ActionConfig | null;
  isSelected: boolean;
  isPedal: boolean;
  onClick: () => void;
}

export function GridButton({ coordKey, action, isSelected, isPedal, onClick }: GridButtonProps) {
  const hasAction = action !== null;

  return (
    <button
      onClick={onClick}
      title={coordKey}
      style={{
        width: isPedal ? '80px' : '72px',
        height: isPedal ? '96px' : '72px',
        borderRadius: isPedal ? '8px 8px 4px 4px' : 'var(--radius-button)',
        border: isSelected
          ? '2px solid var(--accent)'
          : hasAction
            ? '1px solid var(--border-light)'
            : '1px solid var(--border)',
        background: isSelected
          ? 'var(--accent-bg)'
          : hasAction
            ? 'var(--bg-button-configured)'
            : 'var(--bg-button)',
        boxShadow: isSelected
          ? '0 0 12px var(--accent-glow), inset 0 0 12px var(--accent-glow)'
          : hasAction
            ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
            : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '6px',
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {hasAction ? (
        <>
          <span style={{
            fontSize: '16px',
            lineHeight: 1,
            opacity: 0.7,
          }}>
            {ACTION_LABELS[action.type] || '?'}
          </span>
          <span style={{
            fontSize: '9px',
            color: 'var(--text-secondary)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}>
            {action.title || action.type}
          </span>
        </>
      ) : (
        <span style={{
          fontSize: '9px',
          color: 'var(--text-muted)',
          opacity: 0.5,
        }}>
          {coordKey}
        </span>
      )}
    </button>
  );
}
