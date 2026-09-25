/**
 * MatchSettings component — configure fuzzy matching threshold
 */

function MatchSettings({ threshold, onThresholdChange }) {
  const percentage = Math.round(threshold * 100);

  const getThresholdDescription = (val) => {
    if (val >= 0.95) return 'Very strict — only near-identical values match';
    if (val >= 0.85) return 'Strict — catches minor typos (1-2 character differences)';
    if (val >= 0.7) return 'Balanced — catches most typos and abbreviations';
    if (val >= 0.5) return 'Loose — matches partial similarities, more false positives';
    return 'Very loose — matches even distant similarities';
  };

  const getThresholdColor = (val) => {
    if (val >= 0.85) return '#4ade80';
    if (val >= 0.7) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="settings-panel">
      <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
        <label className="setting-item__label">
          🎯 Similarity Threshold: <strong style={{ color: getThresholdColor(threshold) }}>{percentage}%</strong>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Loose 30%</span>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={threshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            className="setting-item__input"
            style={{
              appearance: 'auto',
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              accentColor: getThresholdColor(threshold),
            }}
            id="threshold-slider"
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Strict 100%</span>
        </div>
        <p className="setting-item__hint">
          {getThresholdDescription(threshold)}
          <br />
          Example: "shubham" vs "shuham" has ~86% similarity — {threshold <= 0.86 ? '✅ would match' : '❌ would NOT match'} at current threshold
        </p>
      </div>
    </div>
  );
}

export default MatchSettings;
