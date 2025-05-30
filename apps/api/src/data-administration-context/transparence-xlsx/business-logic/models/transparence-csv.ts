import { z } from 'zod';
import { XlsxReader } from './xlsx-reader';

export type TransparenceCsvSnapshot = {
  nom: string;
  csv: string;
};

export class TransparenceCsv {
  private constructor(
    private _nom: string,
    private _csv: string,
  ) {
    this.setNom(_nom);
    this.setCsv(_csv);
  }

  getTsv(): string {
    return this._csv;
  }

  private setCsv(value: string) {
    this._csv = value;
  }

  private setNom(value: string) {
    this._nom = z.string().parse(value);
  }

  snapshot(): TransparenceCsvSnapshot {
    return {
      nom: this._nom,
      csv: this._csv,
    };
  }

  static fromSnapshot(snapshot: TransparenceCsvSnapshot): TransparenceCsv {
    return new TransparenceCsv(snapshot.nom, snapshot.csv);
  }

  static fromFichierXlsx(xlsxReader: XlsxReader) {
    const nom = xlsxReader.getFileName();
    const data = xlsxReader.getData();

    return new TransparenceCsv(
      nom,
      data.map((row) => row.join('\t')).join('\n'),
    );
  }
}
