import { useProfileStore } from '../store/profile-store';
import { useCurrentDevice, useCurrentPage } from '../store/selectors';
import { GridButton } from './GridButton';

export function GridEditor() {
  const device = useCurrentDevice();
  const page = useCurrentPage();
  const selectedKey = useProfileStore((s) => s.selectedKey);
  const selectKey = useProfileStore((s) => s.selectKey);

  const isPedal = device.id === 'pedal';

  const buttons: { col: number; row: number; key: string }[] = [];
  for (let row = 0; row < device.rows; row++) {
    for (let col = 0; col < device.cols; col++) {
      buttons.push({ col, row, key: `${col},${row}` });
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        {device.name} — {device.totalKeys} keys
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '20px',
        padding: isPedal ? '20px 24px' : '20px',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${device.cols}, 1fr)`,
          gap: isPedal ? '12px' : '8px',
        }}>
          {buttons.map(({ col, row, key }) => (
            <GridButton
              key={key}
              coordKey={key}
              col={col}
              row={row}
              action={page?.actions[key] ?? null}
              icon={page?.icons[key] ?? null}
              isSelected={selectedKey === key}
              isPedal={isPedal}
              onClick={() => selectKey(selectedKey === key ? null : key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
