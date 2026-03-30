import { useProfileStore } from '../store/profile-store';
import { useSelectedAction } from '../store/selectors';
import { ActionTypeSelector } from './ActionTypeSelector';
import { IconEditor } from './IconEditor';
import { HotkeyForm } from './actions/HotkeyForm';
import { OpenForm } from './actions/OpenForm';
import { WebsiteForm } from './actions/WebsiteForm';
import { TextForm } from './actions/TextForm';
import { MediaForm } from './actions/MediaForm';
import { NavigationForm } from './actions/NavigationForm';
import { MultiActionForm } from './actions/MultiActionForm';
import { MultiActionToggleForm } from './actions/MultiActionToggleForm';
import type { ActionConfig } from '../lib/types';

function ActionForm({ action }: { action: ActionConfig }) {
  switch (action.type) {
    case 'hotkey': return <HotkeyForm />;
    case 'open': return <OpenForm />;
    case 'website': return <WebsiteForm />;
    case 'text': return <TextForm />;
    case 'media': return <MediaForm />;
    case 'navigation': return <NavigationForm />;
    case 'multi-action': return <MultiActionForm />;
    case 'multi-action-toggle': return <MultiActionToggleForm />;
  }
}

export function ActionPanel() {
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const clearAction = useProfileStore((s) => s.clearAction);
  const action = useSelectedAction();

  return (
    <aside style={{
      width: '320px',
      flexShrink: 0,
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {selectedKey ? (
        <>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}>
              Key <span style={{ color: 'var(--accent)', fontWeight: 500 }}>[{selectedKey}]</span>
            </span>
            {action && (
              <button
                className="btn-danger"
                onClick={() => clearAction(selectedKey)}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
          }}>
            <IconEditor />
            <ActionTypeSelector />
            {action && <ActionForm action={action} />}
          </div>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '8px',
          color: 'var(--text-muted)',
        }}>
          <span style={{ fontSize: '24px', opacity: 0.3 }}>←</span>
          <span style={{ fontSize: '12px' }}>Select a key to configure</span>
        </div>
      )}
    </aside>
  );
}
