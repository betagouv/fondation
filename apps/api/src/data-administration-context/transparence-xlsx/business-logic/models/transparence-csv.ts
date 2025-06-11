import { z } from 'zod';
import { XlsxReader } from './xlsx-reader';
import { Magistrat } from 'shared-models';

export type TransparenceCsvSnapshot = {
  nom: string;
  data: string[][];
  formation: Magistrat.Formation;
};

export class TransparenceCsv {
  private constructor(
    private _nom: string,
    private _data: string[][],
    private _formation: Magistrat.Formation,
  ) {
    this.setNom(_nom);
    this.setData(_data);
    this.setFormation(_formation);
  }

  getLignes(): string[][] {
    const premièreLigne = this._formation === Magistrat.Formation.SIEGE ? 2 : 3;
    return this._data.slice(premièreLigne).filter((row) => row.length > 0);
  }

  getHeader(): string[] {
    const header =
      this._formation === Magistrat.Formation.SIEGE
        ? this._data[1]!
        : this._data[2]!;
    return header;
  }

  private setNom(value: string) {
    this._nom = z.string().parse(value);
  }
  private setData(value: string[][]) {
    this._data = value;
  }
  private setFormation(formation: Magistrat.Formation) {
    this._formation = z.nativeEnum(Magistrat.Formation).parse(formation);
  }

  snapshot(): TransparenceCsvSnapshot {
    return {
      nom: this._nom,
      data: this._data,
      formation: this._formation,
    };
  }

  static fromSnapshot(snapshot: TransparenceCsvSnapshot): TransparenceCsv {
    return new TransparenceCsv(snapshot.nom, snapshot.data, snapshot.formation);
  }

  static fromFichierXlsx(
    xlsxReader: XlsxReader,
    formation: Magistrat.Formation,
  ) {
    const nom = xlsxReader.getFileName();
    const data = xlsxReader.getData();

    return new TransparenceCsv(nom, data, formation);
  }
}
