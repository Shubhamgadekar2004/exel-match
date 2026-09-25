/**
 * VlookupTool.jsx — Excel VLOOKUP across files
 * Lookup a value in one sheet and pull matching data from another.
 */

import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import FileUploader from './FileUploader';
import Stepper from './Stepper';
import { parseExcelFile } from '../utils/excelParser';
import { similarityRatio } from '../utils/fuzzyMatch';

const STEPS = [
  { label: 'Upload Files', icon: '📁' },
  { label: 'Configure Lookup', icon: '🔎' },
  { label: 'View Results', icon: '📋' },
];

function VlookupTool({ showToast }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState([]);

  // Lookup config
  const [lookupFileIdx, setLookupFileIdx] = useState(0);
  const [lookupSheet, setLookupSheet] = useState('');
  const [lookupColumn, setLookupColumn] = useState('');

  // Target config
  const [targetFileIdx, setTargetFileIdx] = useState(1);
  const [targetSheet, setTargetSheet] = useState('');
  const [targetKeyColumn, setTargetKeyColumn] = useState('');
  const [returnColumns, setReturnColumns] = useState([]);

  // Matching
  const [useFuzzy, setUseFuzzy] = useState(true);
  const [threshold, setThreshold] = useState(0.8);

  // Results
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesAdded = useCallback(async (newFiles) => {
    try {
      const parsed = await Promise.all(newFiles.map((f) => parseExcelFile(f)));
      setFiles((prev) => [...prev, ...parsed]);
      showToast(`${newFiles.length} file(s) uploaded! ✨`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }, [showToast]);

  const handleRemoveFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Derived data
  const lookupFile = files[lookupFileIdx];
  const targetFile = files[targetFileIdx];

  const lookupSheetData = useMemo(() => {
    if (!lookupFile) return null;
    const sn = lookupSheet || lookupFile.sheetNames[0];
    return lookupFile.sheets[sn] || null;
  }, [lookupFile, lookupSheet]);

  const targetSheetData = useMemo(() => {
    if (!targetFile) return null;
    const sn = targetSheet || targetFile.sheetNames[0];
    return targetFile.sheets[sn] || null;
  }, [targetFile, targetSheet]);

  const toggleReturnColumn = (col) => {
    setReturnColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleRunVlookup = useCallback(() => {
    if (!lookupColumn || !targetKeyColumn || returnColumns.length === 0) {
      showToast('Please configure all lookup settings', 'error');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const lookupSN = lookupSheet || lookupFile.sheetNames[0];
        const targetSN = targetSheet || targetFile.sheetNames[0];
        const lSheet = lookupFile.sheets[lookupSN];
        const tSheet = targetFile.sheets[targetSN];

        const lookupData = lSheet.rawData[lookupColumn] || [];
        const targetKeys = tSheet.rawData[targetKeyColumn] || [];
        const targetReturnData = {};
        returnColumns.forEach((col) => {
          targetReturnData[col] = tSheet.rawData[col] || [];
        });

        const resultRows = [];
        let matchCount = 0;
        let fuzzyCount = 0;
        let missCount = 0;

        lookupData.forEach((lookupVal, rowIdx) => {
          const val = String(lookupVal || '').trim();
          if (!val) return;

          let bestIdx = -1;
          let bestSim = 0;
          let isExact = false;

          for (let i = 0; i < targetKeys.length; i++) {
            const targetVal = String(targetKeys[i] || '').trim();
            if (!targetVal) continue;

            if (val.toLowerCase() === targetVal.toLowerCase()) {
              bestIdx = i;
              bestSim = 1;
              isExact = true;
              break;
            }

            if (useFuzzy) {
              const sim = similarityRatio(val, targetVal);
              if (sim > bestSim) {
                bestSim = sim;
                bestIdx = i;
              }
            }
          }

          const matched = bestSim >= (useFuzzy ? threshold : 1);
          const row = {
            lookupValue: val,
            lookupRow: rowIdx + 2, // +2 for 1-index + header
            matched,
            matchedKey: matched && bestIdx >= 0 ? String(targetKeys[bestIdx]) : '—',
            matchedRow: matched && bestIdx >= 0 ? bestIdx + 2 : null,
            similarity: bestSim,
            isExact: isExact && matched,
            returnValues: {},
          };

          returnColumns.forEach((col) => {
            row.returnValues[col] =
              matched && bestIdx >= 0 ? targetReturnData[col][bestIdx] ?? '' : '—';
          });

          if (matched && isExact) matchCount++;
          else if (matched) fuzzyCount++;
          else missCount++;

          resultRows.push(row);
        });

        setResults({
          rows: resultRows,
          stats: {
            total: resultRows.length,
            exact: matchCount,
            fuzzy: fuzzyCount,
            missed: missCount,
          },
          lookupSource: `${lookupFile.fileName} → ${lookupSN} → ${lookupColumn}`,
          targetSource: `${targetFile.fileName} → ${targetSN}`,
          returnColumns,
        });
        setCurrentStep(2);
        showToast(
          `VLOOKUP complete! ${matchCount + fuzzyCount} matches found 🎯`
        );
      } catch (error) {
        showToast(`VLOOKUP failed: ${error.message}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  }, [
    lookupColumn, targetKeyColumn, returnColumns, lookupFile, targetFile,
    lookupSheet, targetSheet, useFuzzy, threshold, showToast,
  ]);

  const handleExport = useCallback(() => {
    if (!results) return;
    const exportData = results.rows.map((row) => {
      const obj = {
        'Lookup Value': row.lookupValue,
        'Lookup Row': row.lookupRow,
        'Matched Key': row.matchedKey,
        'Matched Row': row.matchedRow || '—',
        'Similarity (%)': Math.round(row.similarity * 100),
        'Match Type': row.isExact ? 'EXACT' : row.matched ? 'FUZZY' : 'MISS',
      };
      results.returnColumns.forEach((col) => {
        obj[`Return: ${col}`] = row.returnValues[col];
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VLOOKUP Results');
    XLSX.writeFile(wb, 'vlookup_results.xlsx');
    showToast('Exported! 📥');
  }, [results, showToast]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setResults(null);
    setCurrentStep(0);
    setLookupColumn('');
    setTargetKeyColumn('');
    setReturnColumns([]);
  }, []);

  const [resultFilter, setResultFilter] = useState('all');
  const [resultSearch, setResultSearch] = useState('');

  const filteredResults = useMemo(() => {
    if (!results) return [];
    let rows = results.rows;

    if (resultFilter === 'matched') rows = rows.filter((r) => r.matched);
    else if (resultFilter === 'missed') rows = rows.filter((r) => !r.matched);
    else if (resultFilter === 'fuzzy') rows = rows.filter((r) => r.matched && !r.isExact);

    if (resultSearch.trim()) {
      const q = resultSearch.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.lookupValue.toLowerCase().includes(q) ||
          r.matchedKey.toLowerCase().includes(q) ||
          Object.values(r.returnValues).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    return rows;
  }, [results, resultFilter, resultSearch]);

  return (
    <>
      <Stepper steps={STEPS} currentStep={currentStep} />

      {/* Upload */}
      <section className="section animate-in">
        <div className="card card--glass">
          <div className="card__title">
            <span className="card__title-icon card__title-icon--primary">📁</span>
            Upload Excel Files
          </div>
          <p className="card__description">
            Upload at least 2 files — one with the lookup values, and one with the data to pull from.
          </p>
          <FileUploader onFilesAdded={handleFilesAdded} files={files} onRemoveFile={handleRemoveFile} />
        </div>
      </section>

      {/* Configuration */}
      {files.length >= 2 && (
        <section className="section animate-in animate-in--delay-1">
          <div className="card card--glass">
            <div className="card__title">
              <span className="card__title-icon card__title-icon--accent">🔎</span>
              Configure VLOOKUP
            </div>
            <p className="card__description">
              Like Excel's VLOOKUP: pick the lookup value column, the table to search in, the matching key, and the columns to return.
            </p>

            <div className="vlookup-config">
              {/* Lookup source */}
              <div className="vlookup-panel">
                <h3 className="vlookup-panel__title">
                  <span className="vlookup-panel__badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>1</span>
                  Lookup Values (Source)
                </h3>
                <div className="vlookup-panel__fields">
                  <div className="setting-item">
                    <label className="setting-item__label">📗 Source File</label>
                    <select
                      className="setting-item__input"
                      value={lookupFileIdx}
                      onChange={(e) => {
                        setLookupFileIdx(Number(e.target.value));
                        setLookupSheet('');
                        setLookupColumn('');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {files.map((f, i) => (
                        <option key={i} value={i}>{f.fileName}</option>
                      ))}
                    </select>
                  </div>

                  {lookupFile && lookupFile.sheetNames.length > 1 && (
                    <div className="setting-item">
                      <label className="setting-item__label">📑 Sheet</label>
                      <select
                        className="setting-item__input"
                        value={lookupSheet || lookupFile.sheetNames[0]}
                        onChange={(e) => { setLookupSheet(e.target.value); setLookupColumn(''); }}
                        style={{ cursor: 'pointer' }}
                      >
                        {lookupFile.sheetNames.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {lookupSheetData && (
                    <div className="setting-item">
                      <label className="setting-item__label">📊 Lookup Column</label>
                      <select
                        className="setting-item__input"
                        value={lookupColumn}
                        onChange={(e) => setLookupColumn(e.target.value)}
                        style={{ cursor: 'pointer' }}
                        id="lookup-col-select"
                      >
                        <option value="">— Select column —</option>
                        {lookupSheetData.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider arrow */}
              <div className="vlookup-arrow">→</div>

              {/* Target */}
              <div className="vlookup-panel">
                <h3 className="vlookup-panel__title">
                  <span className="vlookup-panel__badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>2</span>
                  Target Table (Search In)
                </h3>
                <div className="vlookup-panel__fields">
                  <div className="setting-item">
                    <label className="setting-item__label">📙 Target File</label>
                    <select
                      className="setting-item__input"
                      value={targetFileIdx}
                      onChange={(e) => {
                        setTargetFileIdx(Number(e.target.value));
                        setTargetSheet('');
                        setTargetKeyColumn('');
                        setReturnColumns([]);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {files.map((f, i) => (
                        <option key={i} value={i}>{f.fileName}</option>
                      ))}
                    </select>
                  </div>

                  {targetFile && targetFile.sheetNames.length > 1 && (
                    <div className="setting-item">
                      <label className="setting-item__label">📑 Sheet</label>
                      <select
                        className="setting-item__input"
                        value={targetSheet || targetFile.sheetNames[0]}
                        onChange={(e) => { setTargetSheet(e.target.value); setTargetKeyColumn(''); setReturnColumns([]); }}
                        style={{ cursor: 'pointer' }}
                      >
                        {targetFile.sheetNames.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {targetSheetData && (
                    <div className="setting-item">
                      <label className="setting-item__label">🔑 Key Column (to match against)</label>
                      <select
                        className="setting-item__input"
                        value={targetKeyColumn}
                        onChange={(e) => setTargetKeyColumn(e.target.value)}
                        style={{ cursor: 'pointer' }}
                        id="target-key-select"
                      >
                        <option value="">— Select column —</option>
                        {targetSheetData.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {targetSheetData && targetKeyColumn && (
                    <div className="setting-item">
                      <label className="setting-item__label">📋 Columns to Return</label>
                      <div className="column-group__columns" style={{ maxHeight: '160px' }}>
                        {targetSheetData.columns
                          .filter((c) => c !== targetKeyColumn)
                          .map((col) => {
                            const selected = returnColumns.includes(col);
                            return (
                              <div
                                key={col}
                                className={`column-chip ${selected ? 'column-chip--selected' : ''}`}
                                onClick={() => toggleReturnColumn(col)}
                              >
                                <div className="column-chip__checkbox">
                                  {selected ? '✓' : ''}
                                </div>
                                <span className="column-chip__label">{col}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fuzzy toggle */}
            <div className="vlookup-fuzzy-settings">
              <div
                className={`column-chip ${useFuzzy ? 'column-chip--selected' : ''}`}
                onClick={() => setUseFuzzy(!useFuzzy)}
                style={{ display: 'inline-flex', cursor: 'pointer' }}
              >
                <div className="column-chip__checkbox">{useFuzzy ? '✓' : ''}</div>
                <span className="column-chip__label">Enable fuzzy matching (catch typos)</span>
              </div>

              {useFuzzy && (
                <div className="setting-item" style={{ marginTop: '12px', maxWidth: '400px' }}>
                  <label className="setting-item__label">
                    🎯 Threshold: <strong style={{ color: '#fbbf24' }}>{Math.round(threshold * 100)}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Run Button */}
      {files.length >= 2 && lookupColumn && targetKeyColumn && returnColumns.length > 0 && (
        <div className="action-bar animate-in animate-in--delay-2">
          <button
            className="btn btn--primary btn--lg"
            onClick={handleRunVlookup}
            disabled={isProcessing}
            id="run-vlookup-btn"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
          >
            {isProcessing ? (
              <>
                <span className="btn__spinner"></span>
                Looking up...
              </>
            ) : (
              <>🔎 Run VLOOKUP</>
            )}
          </button>
          <button className="btn btn--danger" onClick={handleReset}>
            ✕ Reset
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <section className="section animate-in">
          <div className="card card--glass">
            <div className="card__title">
              <span className="card__title-icon card__title-icon--success">📋</span>
              VLOOKUP Results
            </div>

            {/* Stats */}
            <div className="results__header">
              <div className="results__stats">
                <span className="stat-badge stat-badge--total">📊 {results.stats.total} lookups</span>
                <span className="stat-badge stat-badge--exact">✅ {results.stats.exact} exact</span>
                <span className="stat-badge stat-badge--fuzzy">🔶 {results.stats.fuzzy} fuzzy</span>
                <span className="stat-badge stat-badge--unmatched">❌ {results.stats.missed} missed</span>
              </div>

              <div className="results__filters">
                {['all', 'matched', 'fuzzy', 'missed'].map((f) => (
                  <button
                    key={f}
                    className={`results__filter-btn ${resultFilter === f ? 'results__filter-btn--active' : ''}`}
                    onClick={() => setResultFilter(f)}
                  >
                    {f === 'all' ? 'All' : f === 'matched' ? 'Matched' : f === 'fuzzy' ? 'Fuzzy Only' : 'Missed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="setting-item__input"
                placeholder="🔍 Search values..."
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
              />
            </div>

            {/* Table */}
            {filteredResults.length > 0 ? (
              <div className="results-table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Lookup Value</th>
                      <th>Row</th>
                      <th>Matched Key</th>
                      <th>Row</th>
                      <th>Similarity</th>
                      <th>Type</th>
                      {results.returnColumns.map((col) => (
                        <th key={col} style={{ color: '#fbbf24' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((row, i) => (
                      <tr key={i}>
                        <td><span className="cell-value">{row.lookupValue}</span></td>
                        <td style={{ color: 'var(--text-tertiary)' }}>{row.lookupRow}</td>
                        <td><span className="cell-value">{row.matchedKey}</span></td>
                        <td style={{ color: 'var(--text-tertiary)' }}>{row.matchedRow || '—'}</td>
                        <td>
                          <div className="similarity-bar">
                            <div className="similarity-bar__track">
                              <div
                                className={`similarity-bar__fill ${
                                  row.similarity >= 0.85 ? 'similarity-bar__fill--high' :
                                  row.similarity >= 0.6 ? 'similarity-bar__fill--medium' :
                                  'similarity-bar__fill--low'
                                }`}
                                style={{ width: `${Math.round(row.similarity * 100)}%` }}
                              />
                            </div>
                            <span className="similarity-bar__value" style={{
                              color: row.similarity >= 0.85 ? 'var(--success-400)' :
                                     row.similarity >= 0.6 ? 'var(--warning-400)' :
                                     'var(--danger-400)',
                            }}>
                              {Math.round(row.similarity * 100)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`match-type ${
                            row.isExact ? 'match-type--exact' :
                            row.matched ? 'match-type--fuzzy' :
                            'match-type--none'
                          }`}>
                            {row.isExact ? '✓ Exact' : row.matched ? '≈ Fuzzy' : '✕ Miss'}
                          </span>
                        </td>
                        {results.returnColumns.map((col) => (
                          <td key={col}>
                            <span className="cell-value">{String(row.returnValues[col] ?? '')}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">🔎</div>
                <p className="empty-state__title">No results found</p>
                <p className="empty-state__text">Try adjusting your filters or search</p>
              </div>
            )}

            {/* Export */}
            <div className="export-bar">
              <button className="btn btn--secondary" onClick={handleExport} id="vlookup-export-btn">
                📥 Export to Excel
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default VlookupTool;
