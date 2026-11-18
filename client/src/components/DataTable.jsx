import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Modern Paginated Data Table Component
 * Clean Stripe/Airtable design with sorting preservation and responsive paging
 */
export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  emptyMessage = 'No records found.'
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = data.slice(startIndex, startIndex + pageSize);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((row, rowIdx) => (
                <tr key={row[keyField] || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.render
                        ? col.render(row)
                        : row[col.accessor] !== undefined && row[col.accessor] !== null
                        ? String(row[col.accessor])
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    color: 'var(--text-subtle)'
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.875rem',
            padding: '0 0.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div>
            Showing <strong style={{ color: 'var(--text-main)' }}>{startIndex + 1}</strong> to{' '}
            <strong style={{ color: 'var(--text-main)' }}>
              {Math.min(startIndex + pageSize, data.length)}
            </strong>{' '}
            of <strong style={{ color: 'var(--text-main)' }}>{data.length}</strong> items
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="form-select"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.25rem 0.45rem' }}
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ padding: '0 0.35rem', fontWeight: 500 }}>
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.25rem 0.45rem' }}
                title="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
