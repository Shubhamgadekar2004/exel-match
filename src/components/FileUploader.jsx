/**
 * FileUploader component — drag & drop zone + file list
 */

import { useRef, useState, useCallback } from 'react';
import { formatFileSize } from '../utils/excelParser';

const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
  'application/csv',
];

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function FileUploader({ onFilesAdded, files, onRemoveFile }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const isValidFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(ext) || ACCEPTED_TYPES.includes(file.type);
  };

  const handleFiles = useCallback(
    (fileList) => {
      const validFiles = Array.from(fileList).filter(isValidFile);
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    [onFilesAdded]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div>
      <div
        className={`upload-zone ${isDragging ? 'upload-zone--active' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        id="file-upload-zone"
      >
        <span className="upload-zone__icon">📄</span>
        <p className="upload-zone__text">
          Drag & drop your Excel files here, or <span>browse</span>
        </p>
        <p className="upload-zone__hint">
          Supports .xlsx, .xls, and .csv files • Upload multiple files at once
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          multiple
          onChange={handleInputChange}
          id="file-input"
        />
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, index) => (
            <div key={`${file.fileName}-${index}`} className="file-item">
              <div className="file-item__icon">📗</div>
              <div className="file-item__info">
                <div className="file-item__name">{file.fileName}</div>
                <div className="file-item__meta">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span>
                    {file.sheetNames.length} sheet{file.sheetNames.length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    {Object.values(file.sheets).reduce((sum, s) => sum + (s.rowCount || 0), 0)} rows
                  </span>
                </div>
              </div>
              <button
                className="file-item__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(index);
                }}
                title="Remove file"
                id={`remove-file-${index}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUploader;
