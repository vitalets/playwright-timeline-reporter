/** Downloads the currently filtered test rows as CSV or JSON. */
import type { TestTableRow } from './data.js';

export function TestTableExportButtons({ rows }: { rows: TestTableRow[] }) {
  return (
    <div className="test-table-exports">
      <button type="button" onClick={() => downloadRows(rows, 'csv')}>
        Export CSV
      </button>
      <button type="button" onClick={() => downloadRows(rows, 'json')}>
        Export JSON
      </button>
    </div>
  );
}

function downloadRows(rows: TestTableRow[], type: 'csv' | 'json') {
  const content = type === 'csv' ? toCsv(rows) : JSON.stringify(rows, null, 2);
  const blob = new Blob([content], {
    type: type === 'csv' ? 'text/csv;charset=utf-8' : 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `playwright-test-cases.${type}`;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: TestTableRow[]) {
  const keys = [
    'title',
    'status',
    'duration',
    'path',
    'error',
    'projectName',
    'retry',
    'attempt',
    'attempts',
    'mergeReportId',
  ];
  return [
    keys.join(','),
    ...rows.map((row) =>
      keys.map((key) => quote(String(row[key as keyof TestTableRow] ?? ''))).join(','),
    ),
  ].join('\n');
}

function quote(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
