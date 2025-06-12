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
      .slice(TransparenceCsv.HEADER_LAST_ROW_INDEX + 1)
      .filter((row) => row.length > 0);
  }

  getHeader(): string[] {
    const header = this._data[TransparenceCsv.HEADER_LAST_ROW_INDEX]!;
    return header;
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
