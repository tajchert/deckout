import type { ActionConfig, IconConfig } from '../lib/types';

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
  icon: IconConfig | null;
  isSelected: boolean;
  isPedal: boolean;
  onClick: () => void;
}

export function GridButton({ coordKey, action, icon, isSelected, isPedal, onClick }: GridButtonProps) {
  const hasAction = action !== null;
  const hasIcon = icon && (icon.emoji || icon.imageDataUrl || icon.bgColor !== '#1a1a1a');

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
          : hasAction || hasIcon
            ? '1px solid var(--border-light)'
            : '1px solid var(--border)',
        background: hasIcon && icon.bgColor !== '#1a1a1a'
          ? icon.bgColor
          : isSelected
            ? 'var(--accent-bg)'
            : hasAction
              ? 'var(--bg-button-configured)'
              : 'var(--bg-button)',
        boxShadow: isSelected
          ? '0 0 12px var(--accent-glow), inset 0 0 12px var(--accent-glow)'
          : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '4px',
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Image background */}
      {icon?.imageDataUrl && (
        <img
          src={icon.imageDataUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 'inherit',
          }}
        />
      )}

      {/* Emoji */}
      {icon?.emoji && (
        <span style={{
          fontSize: isPedal ? '28px' : '24px',
          lineHeight: 1,
          position: 'relative',
          zIndex: 1,
          filter: icon.imageDataUrl ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' : 'none',
        }}>
          {icon.emoji}
        </span>
      )}

      {/* Action label (only if no icon emoji) */}
      {hasAction && !icon?.emoji && (
        <span style={{
          fontSize: '16px',
          lineHeight: 1,
          opacity: 0.7,
          position: 'relative',
          zIndex: 1,
        }}>
          {ACTION_LABELS[action.type] || '?'}
        </span>
      )}

      {/* Title text */}
      {hasAction && (
        <span style={{
          fontSize: '9px',
          color: hasIcon ? '#fff' : 'var(--text-secondary)',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
          position: 'relative',
          zIndex: 1,
          textShadow: hasIcon ? '0 1px 2px rgba(0,0,0,0.8)' : 'none',
        }}>
          {action.title || action.type}
        </span>
      )}

      {/* Empty state */}
      {!hasAction && !hasIcon && (
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
