/** Provides page navigation and page-size selection for the test-case table. */
export function TestTablePagination({
  page,
  pageCount,
  pageSize,
  pageSizes,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizes: number[];
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="test-table-pagination">
      <label>
        Rows per page
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className="test-table-page-controls">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          Previous
        </button>
        <span aria-live="polite">
          Page {page} of {pageCount} ({totalRows} results)
        </span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount}>
          Next
        </button>
      </div>
    </div>
  );
}
