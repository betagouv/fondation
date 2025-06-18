import { z } from 'zod';
import { XlsxReader } from './xlsx-reader';

export type TransparenceCsvSnapshot = {
  nom: string;
  data: string[][];
};

export class TransparenceCsv {
  private static HEADER_LAST_ROW_INDEX = 2;

  private constructor(
    private _nom: string,
    private _data: string[][],
  ) {
    this.setNom(_nom);
    this.setData(_data);
  }

  getLignes(): string[][] {
    return this._data
      .slice(this.getHeaderIndex() + 1)
      .filter((row) => row.some((r) => !!r.trim()));
  }

  getHeader(): string[] {
    const header = this._data[this.getHeaderIndex()]!;
    return header;
  }

  private getHeaderIndex() {
    return this._data[1]?.length ? 1 : TransparenceCsv.HEADER_LAST_ROW_INDEX;
  }

  private setNom(value: string) {
    this._nom = z.string().parse(value);
  }
  private setData(value: string[][]) {
    this._data = value;
  }

  snapshot(): TransparenceCsvSnapshot {
    return {
      nom: this._nom,
      data: this._data,
    };
  }

  static fromSnapshot(snapshot: TransparenceCsvSnapshot): TransparenceCsv {
    return new TransparenceCsv(snapshot.nom, snapshot.data);
  }

  static fromFichierXlsx(xlsxReader: XlsxReader) {
    const nom = xlsxReader.getFileName();
    const data = xlsxReader.getData();

    return new TransparenceCsv(nom, data);
  }
}
