/**
 * ResultsView component — displays match results in a filterable table
 */

import { useState, useMemo, useCallback } from 'react';
import { exportResultsToExcel } from '../utils/excelParser';

function DiffText({ segments }) {
  if (!segments) return <span className="cell-value">—</span>;
  return (
    <span className="cell-value">
      {segments.map((seg, i) =>
        seg.isDiff ? (
          <span key={i} className="diff-highlight">{seg.text}</span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}

function SimilarityBar({ value }) {
  const percentage = Math.round(value * 100);
  const fillClass =
    percentage >= 85 ? 'similarity-bar__fill--high' :
    percentage >= 60 ? 'similarity-bar__fill--medium' :
    'similarity-bar__fill--low';

  return (
    <div className="similarity-bar">
      <div className="similarity-bar__track">
        <div
          className={`similarity-bar__fill ${fillClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="similarity-bar__value" style={{
        color: percentage >= 85 ? 'var(--success-400)' :
               percentage >= 60 ? 'var(--warning-400)' :
               'var(--danger-400)'
      }}>
        {percentage}%
      </span>
    </div>
  );
}

function ResultsView({ results, stats }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResults = useMemo(() => {
    let filtered = results;

    if (filter !== 'all') {
      filtered = filtered.filter((r) =>
        r.comparisons.some((c) => c.matchType === filter)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.baseValue.toLowerCase().includes(q) ||
          r.comparisons.some((c) =>
            c.matchedValue.toLowerCase().includes(q)
          )
      );
    }

    return filtered;
  }, [results, filter, searchQuery]);

  const handleExport = useCallback(() => {
    try {
      exportResultsToExcel(results);
    } catch {
      // silent fail
    }
  }, [results]);

  return (
    <div className="results">
      <div className="card card--glass">
        <div className="card__title">
          <span className="card__title-icon card__title-icon--success">✨</span>
          Match Results
        </div>

        {/* Stats badges */}
        <div className="results__header">
          <div className="results__stats">
            <span className="stat-badge stat-badge--total">
              📊 {stats.totalComparisons} total comparisons
            </span>
            <span className="stat-badge stat-badge--exact">
              ✅ {stats.exactMatches} exact
            </span>
            <span className="stat-badge stat-badge--fuzzy">
              🔶 {stats.fuzzyMatches} fuzzy
            </span>
            <span className="stat-badge stat-badge--unmatched">
              ❌ {stats.noMatches} unmatched
            </span>
          </div>

          {/* Filter tabs */}
          <div className="results__filters">
            {['all', 'exact', 'fuzzy', 'none'].map((f) => (
              <button
                key={f}
                className={`results__filter-btn ${filter === f ? 'results__filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
                id={`filter-${f}`}
              >
                {f === 'all' ? 'All' : f === 'exact' ? 'Exact' : f === 'fuzzy' ? 'Fuzzy' : 'No Match'}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="results-search"
          />
        </div>

        {/* Results Table */}
        {filteredResults.length > 0 ? (
          <div className="results-table-wrapper" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Base Value</th>
                  <th>Source</th>
                  <th>Row</th>
                  <th>Matched Value</th>
                  <th>Match Source</th>
                  <th>Row</th>
                  <th>Similarity</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) =>
                  result.comparisons.map((comp, compIdx) => (
                    <tr key={`${result.id}-${compIdx}`}>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>
                        {result.id + 1}
                      </td>
                      <td>
                        {comp.differences ? (
                          <DiffText segments={comp.differences.a} />
                        ) : (
                          <span className="cell-value">{result.baseValue}</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.baseSource}
                      </td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{result.baseRow}</td>
                      <td>
                        {comp.differences ? (
                          <DiffText segments={comp.differences.b} />
                        ) : (
                          <span className="cell-value">{comp.matchedValue}</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {comp.source}
                      </td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{comp.matchedRow > 0 ? comp.matchedRow : '—'}</td>
                      <td>
                        <SimilarityBar value={comp.similarity} />
                      </td>
                      <td>
                        <span className={`match-type match-type--${comp.matchType}`}>
                          {comp.matchType === 'exact' ? '✓ Exact' :
                           comp.matchType === 'fuzzy' ? '≈ Fuzzy' :
                           '✕ None'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <p className="empty-state__title">No results found</p>
            <p className="empty-state__text">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'No matches found for the selected filter'}
            </p>
          </div>
        )}

        {/* Export */}
        <div className="export-bar">
          <button
            className="btn btn--secondary"
            onClick={handleExport}
            id="export-btn"
          >
            📥 Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsView;
