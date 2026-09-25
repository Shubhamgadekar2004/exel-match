/**
 * excelParser.js
 * Handles reading and parsing Excel files using the xlsx library.
 */

import * as XLSX from 'xlsx';

/**
 * Parse an Excel file and return structured data.
 * @param {File} file - The file object from input
 * @returns {Promise<Object>} Parsed file data with sheets, columns, and row data
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheets = {};

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          if (jsonData.length === 0) {
            sheets[sheetName] = { columns: [], rows: [], rawData: {} };
            continue;
          }

          // First row is assumed to be headers
          const headers = jsonData[0].map((h, i) =>
            h !== undefined && h !== null && String(h).trim() !== ''
              ? String(h).trim()
              : `Column ${i + 1}`
          );

          const rows = jsonData.slice(1);

          // Build column data map
          const rawData = {};
          for (let colIdx = 0; colIdx < headers.length; colIdx++) {
            const colName = headers[colIdx];
            rawData[colName] = rows.map((row) => {
              const val = row[colIdx];
              return val !== undefined && val !== null ? val : '';
            });
          }

          sheets[sheetName] = {
            columns: headers,
            rows,
            rawData,
            rowCount: rows.length,
          };
        }

        resolve({
          fileName: file.name,
          fileSize: file.size,
          sheetNames: workbook.SheetNames,
          sheets,
        });
      } catch (error) {
        reject(new Error(`Failed to parse "${file.name}": ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read "${file.name}"`));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Export match results to an Excel file.
 */
export function exportResultsToExcel(results, fileName = 'match_results.xlsx') {
  const exportData = [];

  for (const result of results) {
    for (const comp of result.comparisons) {
      exportData.push({
        'Base Value': result.baseValue,
        'Base Source': result.baseSource,
        'Base Row': result.baseRow,
        'Matched Value': comp.matchedValue,
        'Match Source': comp.source,
        'Matched Row': comp.matchedRow,
        'Similarity (%)': Math.round(comp.similarity * 100),
        'Match Type': comp.matchType.toUpperCase(),
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Match Results');

  // Auto-size columns
  const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...exportData.map((row) => String(row[key] || '').length)) + 2,
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, fileName);
}
