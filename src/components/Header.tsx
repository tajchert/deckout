import { useProfileStore } from '../store/profile-store';
import { DEVICE_LIST } from '../lib/devices';
import { buildProfileDefinition } from '../lib/profile-builder';
import { downloadProfile } from '../lib/zip-generator';
import type { DeviceId, TargetOS } from '../lib/types';
import { useState } from 'react';

export function Header() {
  const profileName = useProfileStore((s) => s.profileName);
  const deviceId = useProfileStore((s) => s.deviceId);
  const targetOS = useProfileStore((s) => s.targetOS);
  const setProfileName = useProfileStore((s) => s.setProfileName);
  const setDevice = useProfileStore((s) => s.setDevice);
  const setTargetOS = useProfileStore((s) => s.setTargetOS);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const state = useProfileStore.getState();
      const definition = buildProfileDefinition(state);
      await downloadProfile(definition);
    } finally {
      setExporting(false);
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px 20px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginRight: '8px',
      }}>
        <span style={{
          color: 'var(--accent)',
          fontWeight: 700,
          fontSize: '15px',
          letterSpacing: '-0.5px',
        }}>SD</span>
        <span style={{
          color: 'var(--text-secondary)',
          fontSize: '15px',
          fontWeight: 500,
        }}>Profile Builder</span>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

      <input
        type="text"
        value={profileName}
        onChange={(e) => setProfileName(e.target.value)}
        placeholder="Profile name..."
        style={{
          width: '200px',
          background: 'var(--bg-tertiary)',
          fontSize: '13px',
        }}
      />

      <select
        value={deviceId}
        onChange={(e) => setDevice(e.target.value as DeviceId)}
        style={{ fontSize: '12px' }}
      >
        {DEVICE_LIST.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.cols}×{d.rows})
          </option>
        ))}
      </select>

      <div style={{
        display: 'flex',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        fontSize: '11px',
      }}>
        {(['macos', 'windows'] as TargetOS[]).map((os) => (
          <button
            key={os}
            onClick={() => setTargetOS(os)}
            style={{
              border: 'none',
              borderRadius: 0,
              padding: '4px 10px',
              fontSize: '11px',
              background: targetOS === os ? 'var(--accent)' : 'transparent',
              color: targetOS === os ? '#000' : 'var(--text-secondary)',
              fontWeight: targetOS === os ? 500 : 400,
            }}
          >
            {os === 'macos' ? 'macOS' : 'Windows'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <a
        href="https://github.com/tajchert/deckout"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--text-muted)',
          fontSize: '13px',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        title="View source on GitHub"
      >
        GitHub
      </a>

      <button
        className="btn-accent"
        onClick={handleExport}
        disabled={exporting || !profileName.trim()}
        style={{
          padding: '8px 20px',
          fontSize: '13px',
          opacity: exporting || !profileName.trim() ? 0.5 : 1,
        }}
      >
        {exporting ? 'Exporting...' : '↓ Export .streamDeckProfile'}
      </button>
    </header>
  );
}
