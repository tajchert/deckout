import { useProfileStore } from '../store/profile-store';

export function PageBar() {
  const pages = useProfileStore((s) => s.pages);
  const currentPageIndex = useProfileStore((s) => s.currentPageIndex);
  const setCurrentPage = useProfileStore((s) => s.setCurrentPage);
  const addPage = useProfileStore((s) => s.addPage);
  const removePage = useProfileStore((s) => s.removePage);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 20px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      flexShrink: 0,
      overflowX: 'auto',
    }}>
      <span style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        marginRight: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        Pages
      </span>

      {pages.map((page, i) => (
        <div key={page.id} style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(i)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              background: i === currentPageIndex ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: i === currentPageIndex ? '#000' : 'var(--text-secondary)',
              fontWeight: i === currentPageIndex ? 500 : 400,
              borderColor: i === currentPageIndex ? 'var(--accent)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {page.name}
          </button>
          {pages.length > 1 && (
            <button
              className="btn-ghost"
              onClick={() => removePage(i)}
              style={{
                padding: '2px 6px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginLeft: '-4px',
              }}
              title="Remove page"
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button
        className="btn-ghost"
        onClick={addPage}
        style={{
          padding: '4px 10px',
          fontSize: '14px',
          color: 'var(--accent)',
          fontWeight: 500,
        }}
        title="Add page"
      >
        +
      </button>
    </div>
  );
}
