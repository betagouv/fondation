import { z } from 'zod';
import { DomainRegistry } from './domain-registry';
import { XlsxReader } from './xlsx-reader';

export type TransparenceCsvSnapshot = {
  id: string;
  nom: string;
  csv: string;
};

export class TransparenceCsv {
  private constructor(
    private _id: string,
    private _nom: string,
    private _csv: string,
  ) {
    this.setId(_id);
    this.setNom(_nom);
    this.setCsv(_csv);
  }

  public get id(): string {
    return this._id;
  }
  private setId(value: string) {
    this._id = value;
  }

  private setCsv(value: string) {
    this._csv = value;
  }

  private setNom(value: string) {
    this._nom = z.string().parse(value);
  }

  snapshot(): TransparenceCsvSnapshot {
    return {
      id: this._id,
      nom: this._nom,
      csv: this._csv,
    };
  }

  static fromSnapshot(snapshot: TransparenceCsvSnapshot): TransparenceCsv {
    return new TransparenceCsv(snapshot.id, snapshot.nom, snapshot.csv);
  }

  static fromFichierXlsx(xlsxReader: XlsxReader) {
    const id = DomainRegistry.uuidGenerator().generate();
    const nom = xlsxReader.getFileName();
    const data = xlsxReader.getData();

    return new TransparenceCsv(
      id,
      nom,
      data.map((row) => row.join('\t')).join('\n'),
    );
  }
}
