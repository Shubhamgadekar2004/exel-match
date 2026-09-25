/**
 * MatcherTool.jsx — Excel Sheet Matcher (fuzzy matching)
 * Extracted from the original App.jsx
 */

import { useState, useCallback } from 'react';
import FileUploader from './FileUploader';
import ColumnSelector from './ColumnSelector';
import MatchSettings from './MatchSettings';
import ResultsView from './ResultsView';
import Stepper from './Stepper';
import { parseExcelFile } from '../utils/excelParser';
import { performMatching, getMatchStats } from '../utils/fuzzyMatch';

const STEPS = [
  { label: 'Upload Files', icon: '📁' },
  { label: 'Select Columns', icon: '📊' },
  { label: 'View Results', icon: '✨' },
];

function MatcherTool({ showToast }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [selections, setSelections] = useState([]);
  const [threshold, setThreshold] = useState(0.75);
  const [results, setResults] = useState(null);
  const [stats, setStats] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesAdded = useCallback(async (newFiles) => {
    try {
      const parsed = await Promise.all(newFiles.map((f) => parseExcelFile(f)));
      setFiles((prev) => [...prev, ...parsed]);
      showToast(`${newFiles.length} file(s) uploaded successfully! ✨`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }, [showToast]);

  const handleRemoveFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setSelections((prev) =>
      prev
        .filter((s) => s.fileIndex !== index)
        .map((s) => ({
          ...s,
          fileIndex: s.fileIndex > index ? s.fileIndex - 1 : s.fileIndex,
        }))
    );
  }, []);

  const handleRunMatch = useCallback(() => {
    if (selections.length < 2) {
      showToast('Please select at least 2 columns to compare', 'error');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const selectionData = selections.map((sel) => {
          const file = files[sel.fileIndex];
          const sheet = file.sheets[sel.sheetName];
          return {
            fileName: file.fileName,
            sheetName: sel.sheetName,
            columnName: sel.columnName,
            data: sheet.rawData[sel.columnName],
          };
        });

        const matchResults = performMatching(selectionData, threshold);
        const matchStats = getMatchStats(matchResults);

        setResults(matchResults);
        setStats(matchStats);
        setCurrentStep(2);
        showToast(
          `Matching complete! Found ${matchStats.exactMatches + matchStats.fuzzyMatches} matches 🎯`
        );
      } catch (error) {
        showToast(`Matching failed: ${error.message}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  }, [selections, files, threshold, showToast]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setSelections([]);
    setResults(null);
    setStats(null);
    setCurrentStep(0);
  }, []);

  const canProceedToColumns = files.length >= 1;
  const canRunMatch = selections.length >= 2;

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
            Drag & drop or browse to upload one or more Excel files (.xlsx, .xls, .csv).
          </p>
          <FileUploader onFilesAdded={handleFilesAdded} files={files} onRemoveFile={handleRemoveFile} />
        </div>
      </section>

      {/* Column Selection */}
      {canProceedToColumns && (
        <section className="section animate-in animate-in--delay-1">
          <div className="card card--glass">
            <div className="card__title">
              <span className="card__title-icon card__title-icon--accent">📊</span>
              Select Columns to Compare
            </div>
            <p className="card__description">
              Choose columns to match across files. Select at least 2 columns.
            </p>
            <ColumnSelector files={files} selections={selections} onChange={setSelections} />
          </div>
        </section>
      )}

      {/* Settings */}
      {canProceedToColumns && (
        <section className="section animate-in animate-in--delay-2">
          <div className="card card--glass">
            <div className="card__title">
              <span className="card__title-icon card__title-icon--success">⚙️</span>
              Match Settings
            </div>
            <p className="card__description">
              Configure fuzzy matching sensitivity. Lower threshold catches more typos.
            </p>
            <MatchSettings threshold={threshold} onThresholdChange={setThreshold} />
          </div>
        </section>
      )}

      {/* Actions */}
      {canProceedToColumns && (
        <div className="action-bar animate-in animate-in--delay-3">
          <button
            className="btn btn--primary btn--lg"
            onClick={handleRunMatch}
            disabled={!canRunMatch || isProcessing}
            id="run-match-btn"
          >
            {isProcessing ? (
              <>
                <span className="btn__spinner"></span>
                Analyzing...
              </>
            ) : (
              <>🔍 Run Fuzzy Match</>
            )}
          </button>
          {files.length > 0 && (
            <button className="btn btn--danger" onClick={handleReset} id="reset-btn">
              ✕ Reset All
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {results && stats && (
        <section className="section animate-in">
          <ResultsView results={results} stats={stats} files={files} threshold={threshold} />
        </section>
      )}
    </>
  );
}

export default MatcherTool;
