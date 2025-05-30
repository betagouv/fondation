import { z } from 'zod';
import { XlsxReader } from './xlsx-reader';

export type TransparenceCsvSnapshot = {
  nom: string;
  csv: string;
  data: string[][];
};

export class TransparenceCsv {
  private constructor(
    private _nom: string,
    private _data: string[][],
    private _csv: string,
  ) {
    this.setNom(_nom);
    this.setCsv(_csv);
    this.setData(_data);
  }

  getTsv(): string {
    return this._csv;
  }

  getLignes(): string[][] {
    return this._data.slice(2).filter((row) => row.length > 0);
  }

  getHeader(): string[] {
    return this._data[1]!;
  }

  private setCsv(value: string) {
    this._csv = value;
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
      csv: this._csv,
      data: this._data,
    };
  }

  static fromSnapshot(snapshot: TransparenceCsvSnapshot): TransparenceCsv {
    return new TransparenceCsv(snapshot.nom, snapshot.data, snapshot.csv);
  }

  static fromFichierXlsx(xlsxReader: XlsxReader) {
    const nom = xlsxReader.getFileName();
    const data = xlsxReader.getData();

    return new TransparenceCsv(
      nom,
      data,
      data.map((row) => row.join('\t')).join('\n'),
    );
  }
}
