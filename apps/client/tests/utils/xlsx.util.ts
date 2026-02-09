import * as excel from 'xlsx';

export function workSheetToWorkBook(sheet: excel.WorkSheet): excel.WorkBook {
  const wb = excel.utils.book_new();
  excel.utils.book_append_sheet(wb, sheet);

  return wb;
}

const MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export function workBookToXlsxBlob(workbook: excel.WorkBook): Blob {
  const arrayBuffer = excel.writeXLSX(workbook, { type: 'buffer' });
  return new Blob([arrayBuffer], { type: MIME_TYPE });
}
