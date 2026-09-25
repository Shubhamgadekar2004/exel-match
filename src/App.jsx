import { useState, useCallback } from 'react';
import './index.css';
import ToolSelector from './components/ToolSelector';
import MatcherTool from './components/MatcherTool';
import MergerTool from './components/MergerTool';
import VlookupTool from './components/VlookupTool';

const TOOL_META = {
  matcher: { title: 'Excel Sheet Matcher', icon: '🔍', subtitle: 'Fuzzy Match & Compare' },
  merger: { title: 'Multiple Excel Merger', icon: '🔗', subtitle: 'Combine & Consolidate' },
  vlookup: { title: 'Excel VLOOKUP', icon: '🔎', subtitle: 'Lookup & Pull Data' },
};

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSelectTool = useCallback((toolId) => {
    setActiveTool(toolId);
  }, []);

  const handleGoHome = useCallback(() => {
    setActiveTool(null);
  }, []);

  const meta = activeTool ? TOOL_META[activeTool] : null;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        {activeTool && (
          <button className="header__back-btn" onClick={handleGoHome} id="back-btn">
            ← Back to Tools
          </button>
        )}
        <div className="header__badge">
          <span className="header__badge-dot"></span>
          {activeTool ? meta.subtitle : 'Excel Power Tools Suite'}
        </div>
        <h1 className="header__title">
          {activeTool ? (
            <>
              <span style={{ marginRight: '8px' }}>{meta.icon}</span>
              {meta.title}
            </>
          ) : (
            'ExcelMatch Pro'
          )}
        </h1>
        <p className="header__subtitle">
          {activeTool
            ? null
            : 'Upload, compare, merge, and lookup across your Excel sheets — with intelligent fuzzy matching'}
        </p>
      </header>

      {/* Content */}
      {!activeTool && <ToolSelector onSelectTool={handleSelectTool} />}
      {activeTool === 'matcher' && <MatcherTool showToast={showToast} />}
      {activeTool === 'merger' && <MergerTool showToast={showToast} />}
      {activeTool === 'vlookup' && <VlookupTool showToast={showToast} />}

      {/* Toast */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
