import { useProfileStore } from '../../store/profile-store';
import { useSelectedAction } from '../../store/selectors';
import type { MediaType } from '../../lib/types';

const MEDIA_OPTIONS: { value: MediaType; label: string }[] = [
  { value: 'mute', label: 'Mute / Unmute' },
  { value: 'volume-up', label: 'Volume Up' },
  { value: 'volume-down', label: 'Volume Down' },
  { value: 'play-pause', label: 'Play / Pause' },
  { value: 'next-track', label: 'Next Track' },
  { value: 'previous-track', label: 'Previous Track' },
];

export function MediaForm() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const setAction = useProfileStore((s) => s.setAction);
  const action = useSelectedAction();

  if (!action || action.type !== 'media' || !selectedKey) return null;

  const update = (mediaType: MediaType) => {
    const opt = MEDIA_OPTIONS.find((o) => o.value === mediaType);
    setAction(selectedKey, { ...action, mediaType, title: opt?.label ?? mediaType });
  };

  return (
    <>
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={action.title}
          onChange={(e) => setAction(selectedKey, { ...action, title: e.target.value })}
          placeholder="Button label..."
        />
      </div>
      <div className="form-group">
        <label>Media Action</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {MEDIA_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update(opt.value)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                textAlign: 'left',
                background: action.mediaType === opt.value ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
                borderColor: action.mediaType === opt.value ? 'var(--accent)' : 'var(--border)',
                color: action.mediaType === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
