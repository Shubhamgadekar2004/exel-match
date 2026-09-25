/**
 * ColumnSelector component — lets users pick which columns to compare
 */

import { useState, useCallback } from 'react';

const FILE_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', icon: '📘' },
  { bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', icon: '📙' },
  { bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', icon: '📕' },
  { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', icon: '📗' },
  { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', icon: '📒' },
];

function ColumnSelector({ files, selections, onChange }) {
  // Track which sheet is selected per file
  const [activeSheets, setActiveSheets] = useState(() =>
    files.map((f) => f.sheetNames[0])
  );

  // Update activeSheets when files change
  if (activeSheets.length !== files.length) {
    const newSheets = files.map((f, i) => activeSheets[i] || f.sheetNames[0]);
    setActiveSheets(newSheets);
  }

  const handleSheetChange = useCallback((fileIndex, sheetName) => {
    setActiveSheets((prev) => {
      const next = [...prev];
      next[fileIndex] = sheetName;
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (fileIndex, sheetName, columnName) => {
      return selections.some(
        (s) =>
          s.fileIndex === fileIndex &&
          s.sheetName === sheetName &&
          s.columnName === columnName
      );
    },
    [selections]
  );

  const toggleColumn = useCallback(
    (fileIndex, sheetName, columnName) => {
      const exists = selections.findIndex(
        (s) =>
          s.fileIndex === fileIndex &&
          s.sheetName === sheetName &&
          s.columnName === columnName
      );

      let newSelections;
      if (exists >= 0) {
        newSelections = selections.filter((_, i) => i !== exists);
      } else {
        newSelections = [...selections, { fileIndex, sheetName, columnName }];
      }

      onChange(newSelections);
    },
    [selections, onChange]
  );

  return (
    <div className="column-selector">
      {files.map((file, fileIndex) => {
        const colorSet = FILE_COLORS[fileIndex % FILE_COLORS.length];
        const currentSheet = activeSheets[fileIndex] || file.sheetNames[0];
        const sheet = file.sheets[currentSheet];

        return (
          <div key={`${file.fileName}-${fileIndex}`} className="column-group">
            <div className="column-group__header">
              <div
                className="column-group__file-icon"
                style={{ background: colorSet.bg, color: colorSet.color }}
              >
                {colorSet.icon}
              </div>
              <span className="column-group__file-name" title={file.fileName}>
                {file.fileName}
              </span>
            </div>

            {/* Sheet selector (if multiple sheets) */}
            {file.sheetNames.length > 1 && (
              <select
                className="column-group__sheet-select"
                value={currentSheet}
                onChange={(e) => handleSheetChange(fileIndex, e.target.value)}
                id={`sheet-select-${fileIndex}`}
              >
                {file.sheetNames.map((name) => (
                  <option key={name} value={name}>
                    {name} ({file.sheets[name].rowCount || 0} rows)
                  </option>
                ))}
              </select>
            )}

            {/* Column chips */}
            <div className="column-group__columns">
              {sheet && sheet.columns.length > 0 ? (
                sheet.columns.map((col) => {
                  const selected = isSelected(fileIndex, currentSheet, col);
                  return (
                    <div
                      key={col}
                      className={`column-chip ${selected ? 'column-chip--selected' : ''}`}
                      onClick={() => toggleColumn(fileIndex, currentSheet, col)}
                      id={`col-${fileIndex}-${col}`}
                    >
                      <div className="column-chip__checkbox">
                        {selected ? '✓' : ''}
                      </div>
                      <span className="column-chip__label">{col}</span>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state" style={{ padding: '20px' }}>
                  <p className="empty-state__text">No columns found in this sheet</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ColumnSelector;
