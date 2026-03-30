import { Header } from './Header';
import { GridEditor } from './GridEditor';
import { ActionPanel } from './ActionPanel';
import { PageBar } from './PageBar';

export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <Header />
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        gap: 0,
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflow: 'auto',
        }}>
          <GridEditor />
        </div>
        <ActionPanel />
      </div>
      <PageBar />
    </div>
  );
}
