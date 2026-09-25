/**
 * MergerTool.jsx — Merge multiple Excel files into one
 */

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import FileUploader from './FileUploader';
import Stepper from './Stepper';
import { parseExcelFile } from '../utils/excelParser';

const STEPS = [
  { label: 'Upload Files', icon: '📁' },
  { label: 'Configure', icon: '⚙️' },
  { label: 'Download', icon: '📥' },
];

const MERGE_MODES = [
  {
    id: 'append-rows',
    icon: '📄',
    title: 'Append Rows (Single Sheet)',
    description: 'Combine all rows from all files/sheets into one single sheet. Columns with matching headers are aligned automatically.',
  },
  {
    id: 'separate-sheets',
    icon: '📑',
    title: 'Keep as Separate Sheets',
    description: 'Each source file (or sheet) becomes its own sheet in the output workbook. Preserves original data structure.',
  },
  {
    id: 'merge-by-column',
    icon: '🔗',
    title: 'Merge by Key Column',
    description: 'Join files side by side using a common key column (like VLOOKUP merge). Rows with matching keys are combined.',
  },
];

function MergerTool({ showToast }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [mergeMode, setMergeMode] = useState('append-rows');
  const [keyColumn, setKeyColumn] = useState('');
  const [selectedSheets, setSelectedSheets] = useState({}); // fileIndex -> sheetName
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergeResult, setMergeResult] = useState(null);

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

  // Get active sheet for each file
  const getActiveSheet = (fileIndex) => {
    return selectedSheets[fileIndex] || files[fileIndex]?.sheetNames[0];
  };

  // Gather all unique columns across all active sheets
  const getAllColumns = () => {
    const cols = new Set();
    files.forEach((file, idx) => {
      const sheetName = getActiveSheet(idx);
      const sheet = file.sheets[sheetName];
      if (sheet) {
        sheet.columns.forEach((c) => cols.add(c));
      }
    });
    return Array.from(cols);
  };

  const handleMerge = useCallback(() => {
    if (files.length < 2) {
      showToast('Upload at least 2 files to merge', 'error');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const workbook = XLSX.utils.book_new();

        if (mergeMode === 'append-rows') {
          // Gather all unique columns
          const allColumns = getAllColumns();
          const allRows = [];

          files.forEach((file, fileIdx) => {
            const sheetName = getActiveSheet(fileIdx);
            const sheet = file.sheets[sheetName];
            if (!sheet) return;

            sheet.rows.forEach((row) => {
              const newRow = {};
              sheet.columns.forEach((col, colIdx) => {
                newRow[col] = row[colIdx] !== undefined ? row[colIdx] : '';
              });
              // Add source column
              newRow['__Source File'] = file.fileName;
              newRow['__Source Sheet'] = sheetName;
              allRows.push(newRow);
            });
          });

          const orderedColumns = [...allColumns, '__Source File', '__Source Sheet'];
          const worksheet = XLSX.utils.json_to_sheet(allRows, { header: orderedColumns });

          // Auto-width
          worksheet['!cols'] = orderedColumns.map((key) => ({
            wch: Math.max(
              key.length,
              ...allRows.slice(0, 100).map((r) => String(r[key] || '').length)
            ) + 2,
          }));

          XLSX.utils.book_append_sheet(workbook, worksheet, 'Merged');

        } else if (mergeMode === 'separate-sheets') {
          files.forEach((file, fileIdx) => {
            const sheetName = getActiveSheet(fileIdx);
            const sheet = file.sheets[sheetName];
            if (!sheet) return;

            const rows = sheet.rows.map((row) => {
              const obj = {};
              sheet.columns.forEach((col, colIdx) => {
                obj[col] = row[colIdx] !== undefined ? row[colIdx] : '';
              });
              return obj;
            });

            const worksheet = XLSX.utils.json_to_sheet(rows, { header: sheet.columns });
            // Truncate sheet name to 31 chars (Excel limit) and ensure uniqueness
            let name = `${file.fileName.replace(/\.[^.]+$/, '')}_${sheetName}`.substring(0, 31);
            // Ensure unique name
            let counter = 1;
            let baseName = name;
            while (workbook.SheetNames.includes(name)) {
              name = `${baseName.substring(0, 28)}_${counter++}`;
            }
            XLSX.utils.book_append_sheet(workbook, worksheet, name);
          });

        } else if (mergeMode === 'merge-by-column') {
          if (!keyColumn) {
            showToast('Please select a key column for merging', 'error');
            setIsProcessing(false);
            return;
          }

          // Build a map of key -> merged row
          const mergedMap = new Map();
          const allColumnsSet = new Set();

          files.forEach((file, fileIdx) => {
            const sheetName = getActiveSheet(fileIdx);
            const sheet = file.sheets[sheetName];
            if (!sheet) return;

            const prefix = file.fileName.replace(/\.[^.]+$/, '');
            const keyIdx = sheet.columns.indexOf(keyColumn);

            sheet.columns.forEach((col) => {
              const colName = col === keyColumn ? keyColumn : `${prefix}_${col}`;
              allColumnsSet.add(colName);
            });

            if (keyIdx === -1) return;

            sheet.rows.forEach((row) => {
              const keyVal = String(row[keyIdx] || '').trim();
              if (!keyVal) return;

              if (!mergedMap.has(keyVal)) {
                mergedMap.set(keyVal, { [keyColumn]: keyVal });
              }

              const merged = mergedMap.get(keyVal);
              sheet.columns.forEach((col, colIdx) => {
                const colName = col === keyColumn ? keyColumn : `${prefix}_${col}`;
                merged[colName] = row[colIdx] !== undefined ? row[colIdx] : '';
              });
            });
          });

          const mergedRows = Array.from(mergedMap.values());
          const orderedCols = [keyColumn, ...Array.from(allColumnsSet).filter((c) => c !== keyColumn)];
          const worksheet = XLSX.utils.json_to_sheet(mergedRows, { header: orderedCols });

          worksheet['!cols'] = orderedCols.map((key) => ({
            wch: Math.max(
              key.length,
              ...mergedRows.slice(0, 100).map((r) => String(r[key] || '').length)
            ) + 2,
          }));

          XLSX.utils.book_append_sheet(workbook, worksheet, 'Merged by Key');
        }

        // Generate stats
        const totalSheets = workbook.SheetNames.length;
        let totalRows = 0;
        workbook.SheetNames.forEach((name) => {
          const ws = workbook.Sheets[name];
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
          totalRows += range.e.r; // rows (0-indexed, header not counted)
        });

        setMergeResult({ workbook, totalSheets, totalRows });
        setCurrentStep(2);
        showToast(`Merge complete! ${totalRows} rows across ${totalSheets} sheet(s) 🎉`);
      } catch (error) {
        showToast(`Merge failed: ${error.message}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  }, [files, mergeMode, keyColumn, selectedSheets, showToast]);

  const handleDownload = useCallback(() => {
    if (!mergeResult) return;
    XLSX.writeFile(mergeResult.workbook, 'merged_output.xlsx');
    showToast('File downloaded! 📥');
  }, [mergeResult, showToast]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setMergeResult(null);
    setCurrentStep(0);
    setKeyColumn('');
    setSelectedSheets({});
  }, []);

  const allColumns = files.length > 0 ? getAllColumns() : [];

  return (
    <>
      <Stepper steps={STEPS} currentStep={currentStep} />

      {/* Upload */}
      <section className="section animate-in">
        <div className="card card--glass">
          <div className="card__title">
            <span className="card__title-icon card__title-icon--primary">📁</span>
            Upload Files to Merge
          </div>
          <p className="card__description">
            Upload 2 or more Excel files. All data will be combined into a single output file.
          </p>
          <FileUploader onFilesAdded={handleFilesAdded} files={files} onRemoveFile={handleRemoveFile} />
        </div>
      </section>

      {/* Sheet Selector per file */}
      {files.length > 0 && files.some((f) => f.sheetNames.length > 1) && (
        <section className="section animate-in animate-in--delay-1">
          <div className="card card--glass">
            <div className="card__title">
              <span className="card__title-icon card__title-icon--accent">📑</span>
              Select Sheets
            </div>
            <p className="card__description">
              Some files have multiple sheets. Choose which sheet to use from each file.
            </p>
            <div className="settings-panel">
              {files.map((file, idx) =>
                file.sheetNames.length > 1 ? (
                  <div key={idx} className="setting-item">
                    <label className="setting-item__label">📗 {file.fileName}</label>
                    <select
                      className="setting-item__input"
                      value={getActiveSheet(idx)}
                      onChange={(e) =>
                        setSelectedSheets((prev) => ({ ...prev, [idx]: e.target.value }))
                      }
                      style={{ cursor: 'pointer' }}
                    >
                      {file.sheetNames.map((name) => (
                        <option key={name} value={name}>
                          {name} ({file.sheets[name].rowCount || 0} rows)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </section>
      )}

      {/* Merge Mode */}
      {files.length >= 2 && (
        <section className="section animate-in animate-in--delay-1">
          <div className="card card--glass">
            <div className="card__title">
              <span className="card__title-icon card__title-icon--success">⚙️</span>
              Merge Mode
            </div>
            <p className="card__description">Choose how you want to combine your files.</p>

            <div className="merge-modes">
              {MERGE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  className={`merge-mode-card ${mergeMode === mode.id ? 'merge-mode-card--active' : ''}`}
                  onClick={() => setMergeMode(mode.id)}
                  id={`mode-${mode.id}`}
                >
                  <div className="merge-mode-card__icon">{mode.icon}</div>
                  <div className="merge-mode-card__text">
                    <div className="merge-mode-card__title">{mode.title}</div>
                    <div className="merge-mode-card__description">{mode.description}</div>
                  </div>
                  <div className={`merge-mode-card__radio ${mergeMode === mode.id ? 'merge-mode-card__radio--active' : ''}`}>
                    {mergeMode === mode.id && <span>✓</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* Key column selector for merge-by-column */}
            {mergeMode === 'merge-by-column' && (
              <div className="setting-item" style={{ marginTop: '20px' }}>
                <label className="setting-item__label">🔑 Key Column (must exist in all files)</label>
                <select
                  className="setting-item__input"
                  value={keyColumn}
                  onChange={(e) => setKeyColumn(e.target.value)}
                  style={{ cursor: 'pointer' }}
                  id="key-column-select"
                >
                  <option value="">— Select a key column —</option>
                  {allColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Action */}
      {files.length >= 2 && (
        <div className="action-bar animate-in animate-in--delay-2">
          <button
            className="btn btn--primary btn--lg"
            onClick={handleMerge}
            disabled={isProcessing || (mergeMode === 'merge-by-column' && !keyColumn)}
            id="merge-btn"
          >
            {isProcessing ? (
              <>
                <span className="btn__spinner"></span>
                Merging...
              </>
            ) : (
              <>🔗 Merge Files</>
            )}
          </button>
          <button className="btn btn--danger" onClick={handleReset} id="merger-reset-btn">
            ✕ Reset
          </button>
        </div>
      )}

      {/* Result / Download */}
      {mergeResult && (
        <section className="section animate-in">
          <div className="card card--glass">
            <div className="card__title">
              <span className="card__title-icon card__title-icon--success">✅</span>
              Merge Complete!
            </div>

            <div className="merge-result">
              <div className="merge-result__stats">
                <div className="merge-result__stat">
                  <span className="merge-result__stat-value">{files.length}</span>
                  <span className="merge-result__stat-label">Files Merged</span>
                </div>
                <div className="merge-result__stat">
                  <span className="merge-result__stat-value">{mergeResult.totalSheets}</span>
                  <span className="merge-result__stat-label">Output Sheets</span>
                </div>
                <div className="merge-result__stat">
                  <span className="merge-result__stat-value">{mergeResult.totalRows}</span>
                  <span className="merge-result__stat-label">Total Rows</span>
                </div>
              </div>

              <button className="btn btn--primary btn--lg btn--full" onClick={handleDownload} id="download-merged-btn">
                📥 Download Merged File
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default MergerTool;
