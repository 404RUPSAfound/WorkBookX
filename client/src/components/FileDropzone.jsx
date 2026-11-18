import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';

/**
 * Modern Drag-and-Drop Zone (Vercel/Linear Style)
 * Supports Excel (.xlsx, .xls) and CSV (.csv) files up to 15MB
 */
export function FileDropzone({ label, file, onFileSelect, onFileRemove, required = true }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSet(e.target.files[0]);
    }
  };

  const validateAndSet = (selectedFile) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      alert(`Invalid format "${ext}". Please upload an Excel workbook (.xlsx, .xls) or CSV (.csv) file.`);
      return;
    }
    onFileSelect(selectedFile);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
        {label} {required && <span style={{ color: 'var(--critical)' }}>*</span>}
      </label>

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1.5px dashed ${isDragOver ? 'var(--primary)' : 'rgba(203, 213, 225, 0.9)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            backgroundColor: isDragOver ? 'rgba(239, 246, 255, 0.95)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 4px 18px rgba(31, 38, 135, 0.04)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleChange}
          />

          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              backgroundColor: isDragOver ? 'var(--primary)' : 'var(--primary-subtle)',
              color: isDragOver ? 'white' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(30, 86, 240, 0.15)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <UploadCloud size={22} />
          </div>

          <div>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--primary)' }}>
              Choose a file
            </span>
            <span style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}> or drag it here</span>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            Excel (.xlsx, .xls) or CSV (.csv) up to 15MB
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.15rem',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 16px rgba(31, 38, 135, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileSpreadsheet size={18} />
            </div>

            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>
                {formatSize(file.size)} • Ready for analysis
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onFileRemove}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
