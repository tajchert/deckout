import { useState, useRef, useCallback } from 'react';
import { useProfileStore } from '../store/profile-store';
import { useSelectedIcon } from '../store/selectors';
import type { IconConfig } from '../lib/types';

const EMOJI_LIST = [
  '🎮', '🎧', '🎬', '🎵', '🎤', '🔊', '🔇', '🖥️', '💻', '⌨️',
  '🖱️', '📂', '📁', '🌐', '🔗', '📧', '💬', '📱', '📷', '🎥',
  '🔴', '🟢', '🟡', '🔵', '⚪', '⚫', '🟠', '🟣', '⭐', '💡',
  '🔒', '🔓', '🔑', '⚙️', '🛠️', '🔧', '📝', '✏️', '🗑️', '📋',
  '▶️', '⏸️', '⏹️', '⏭️', '⏮️', '🔄', '⏩', '⏪', '🔀', '🔁',
  '🚀', '💾', '📊', '📈', '🐛', '✅', '❌', '⚠️', '💤', '🔔',
  '🏠', '🔍', '➕', '➖', '🎯', '💎', '🔥', '⚡', '❤️', '👍',
  '🐙', '🤖', '👾', '🎨', '🧪', '📦', '🏗️', '🧹', '🪄', '🎪',
];

const COLOR_PRESETS = [
  '#1a1a1a', '#2d2d2d', '#ff6b00', '#e53935', '#43a047',
  '#1e88e5', '#8e24aa', '#f9a825', '#00acc1', '#6d4c41',
];

export function IconEditor() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setIcon = useProfileStore((s) => s.setIcon);
  const clearIcon = useProfileStore((s) => s.clearIcon);
  const icon = useSelectedIcon();
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentIcon: IconConfig = icon ?? { bgColor: '#1a1a1a' };

  const update = useCallback((partial: Partial<IconConfig>) => {
    if (!selectedKey) return;
    setIcon(selectedKey, { ...currentIcon, ...partial });
  }, [selectedKey, currentIcon, setIcon]);

  const handleImageUpload = useCallback((file: File) => {
    if (!selectedKey) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      update({ imageDataUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }, [selectedKey, update]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  if (!selectedKey) return null;

  const hasIcon = icon && (icon.emoji || icon.imageDataUrl || icon.bgColor !== '#1a1a1a');

  return (
    <div style={{
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
      marginBottom: '12px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
      }}>
        <label style={{ marginBottom: 0 }}>Button Icon</label>
        {hasIcon && (
          <button
            className="btn-ghost"
            onClick={() => clearIcon(selectedKey)}
            style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--text-muted)' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Preview + Image Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--radius-button)',
          background: currentIcon.bgColor,
          border: '2px dashed var(--border-light)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: '10px',
        }}
      >
        {currentIcon.imageDataUrl ? (
          <img
            src={currentIcon.imageDataUrl}
            alt="icon"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
        {currentIcon.emoji && (
          <span style={{
            fontSize: '36px',
            position: currentIcon.imageDataUrl ? 'absolute' : 'static',
            filter: currentIcon.imageDataUrl ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none',
          }}>
            {currentIcon.emoji}
          </span>
        )}
        {!currentIcon.emoji && !currentIcon.imageDataUrl && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
            Drop<br/>image
          </span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
      </div>

      {currentIcon.imageDataUrl && (
        <button
          className="btn-ghost"
          onClick={() => update({ imageDataUrl: undefined })}
          style={{ fontSize: '11px', padding: '2px 8px', marginBottom: '8px', color: 'var(--danger)' }}
        >
          Remove image
        </button>
      )}

      {/* Background Color */}
      <div className="form-group" style={{ marginBottom: '10px' }}>
        <label>Background</label>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => update({ bgColor: color })}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: color,
                border: currentIcon.bgColor === color
                  ? '2px solid var(--accent)'
                  : '1px solid var(--border-light)',
                padding: 0,
                cursor: 'pointer',
              }}
              title={color}
            />
          ))}
          <input
            type="color"
            value={currentIcon.bgColor}
            onChange={(e) => update({ bgColor: e.target.value })}
            style={{
              width: '24px',
              height: '24px',
              padding: 0,
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              cursor: 'pointer',
              background: 'transparent',
            }}
            title="Custom color"
          />
        </div>
      </div>

      {/* Emoji Picker */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Emoji</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          {currentIcon.emoji && (
            <span style={{
              fontSize: '20px',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px',
              padding: '2px 6px',
            }}>
              {currentIcon.emoji}
            </span>
          )}
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            {showEmojis ? 'Hide' : 'Pick emoji'}
          </button>
          {currentIcon.emoji && (
            <button
              className="btn-ghost"
              onClick={() => update({ emoji: undefined })}
              style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--text-muted)' }}
            >
              ×
            </button>
          )}
        </div>
        {showEmojis && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '2px',
            padding: '8px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            maxHeight: '160px',
            overflowY: 'auto',
          }}>
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { update({ emoji }); setShowEmojis(false); }}
                style={{
                  fontSize: '18px',
                  padding: '4px',
                  background: currentIcon.emoji === emoji ? 'var(--accent-bg)' : 'transparent',
                  border: currentIcon.emoji === emoji ? '1px solid var(--accent)' : '1px solid transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
