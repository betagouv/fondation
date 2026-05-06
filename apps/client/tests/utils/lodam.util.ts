import * as excel from 'xlsx';

import { table } from './table.util';
import { workBookToXlsxBlob, workSheetToWorkBook } from './xlsx.util';

type NominationFileRow = {
  number: number;
  name: string;
  targetedPosition: string;
  birthDate: Date;
  currentPosition: string;
  lastPositionDate: Date;
  lastRankingDate: Date;
  movementType: 'A' | 'E';
  observers: string;
  reporters: string;
  career: string;
  history: string;
};

type NominationFileRows = NominationFileRow[keyof NominationFileRow];

function $date(date: Date): string {
  const [dd, mm, yyyy] = [
    date.getUTCDate().toString().padStart(2, '0'),
    (date.getUTCMonth() + 1).toString().padStart(2, '0'),
    date.getUTCFullYear(),
  ];

  return `${dd}/${mm}/${yyyy}`;
}

export async function lodam(template: TemplateStringsArray, ...args: NominationFileRows[]): Promise<Blob> {
  const objects = table<NominationFileRow>(template, ...args);
  const header: (string | number)[][] = [Object.keys(objects[0])];
  const rows = objects.map((object) => Object.values(object).map((v) => (v instanceof Date ? $date(v) : v)));

  const rowsWithHeader = header.concat(rows);

  const ws = excel.utils.aoa_to_sheet(
    Array.from({ length: 2 }).map(() => Array.from({ length: rows[0].length }).map(() => '')),
  );

  excel.utils.sheet_add_aoa(ws, rowsWithHeader, { origin: 'A3' });

  return workBookToXlsxBlob(workSheetToWorkBook(ws));
}
