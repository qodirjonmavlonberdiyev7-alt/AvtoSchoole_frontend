import ExcelJS from 'exceljs';

export interface ExcelColumn<T> {
  header: string;
  key: string;
  width?: number;
  value: (row: T) => string | number | Date | null;
}

export interface ExcelSheetInput<T> {
  name: string;
  columns: ExcelColumn<T>[];
  rows: T[];
}

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FF' } };

/**
 * Builds a formatted .xlsx workbook (bold tinted header row, sized columns, autofilter) and
 * triggers a browser download - one sheet per entry, so a single click can export several related
 * tables at once. Takes `any` here (rather than `unknown`) so each call site's sheet objects keep
 * their own concrete row type - callers still get full type-checking on their own column/row pairing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportToExcel(filename: string, sheets: ExcelSheetInput<any>[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Xorazm.PravaUz';
  workbook.created = new Date();

  sheets.forEach((sheet) => {
    const worksheet = workbook.addWorksheet(sheet.name);
    worksheet.columns = sheet.columns.map((col) => ({ header: col.header, key: col.key, width: col.width ?? 20 }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = HEADER_FILL;
    headerRow.alignment = { vertical: 'middle' };

    sheet.rows.forEach((row) => {
      const rowData: Record<string, string | number | Date | null> = {};
      sheet.columns.forEach((col) => {
        rowData[col.key] = col.value(row);
      });
      worksheet.addRow(rowData);
    });

    if (sheet.columns.length > 0) {
      const lastColumnLetter = worksheet.getColumn(sheet.columns.length).letter;
      worksheet.autoFilter = { from: 'A1', to: `${lastColumnLetter}1` };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
