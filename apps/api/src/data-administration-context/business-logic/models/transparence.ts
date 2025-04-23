import { Magistrat, Transparency } from 'shared-models';
import { z } from 'zod';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from './nomination-file';

export type TransparenceSnapshot = {
  id: string;
  name: Transparency;
  formations: Magistrat.Formation[];
  nominationFiles: NominationFileModelSnapshot[];
};

export class Transparence {
  private _formations: Set<Magistrat.Formation>;

  private constructor(
    private _name: Transparency,
    _formations: Magistrat.Formation[],
    private _nominationFiles: NominationFileModel[],
  ) {
    this.name = _name;
    this.formations = _formations;
    this.nominationFiles = _nominationFiles;
  }

  get name() {
    return this._name;
  }
  set name(name: Transparency) {
    this._name = z.nativeEnum(Transparency).parse(name);
  }

  set formations(formations: Magistrat.Formation[]) {
    this._formations = z
      .set(z.nativeEnum(Magistrat.Formation))
      .nonempty()
      .max(2)
      .parse(new Set(formations));
  }

  get nominationFiles(): NominationFileModel[] {
    return [...this._nominationFiles];
  }
  private set nominationFiles(nominationFiles: NominationFileModel[]) {
    this._nominationFiles = z.any().array().nonempty().parse(nominationFiles);
  }

  addNominationFile(nominationFile: NominationFileModel): void {
    this._nominationFiles.push(nominationFile);
  }

  addNominationFiles(nominationFiles: NominationFileModel[]): void {
    this._nominationFiles.push(...nominationFiles);
  }

  snapshot(): TransparenceSnapshot {
    return {
      id: this._name,
      name: this._name,
      formations: [...this._formations],
      nominationFiles: this._nominationFiles.map((file) => file.toSnapshot()),
    };
  }

  static fromSnapshot(snapshot: TransparenceSnapshot): Transparence {
    return new Transparence(
      snapshot.name,
      snapshot.formations,
      snapshot.nominationFiles.map(NominationFileModel.fromSnapshot),
    );
  }

  static nouvelle(
    name: Transparency,
    formations: Magistrat.Formation[],
    nominationFiles: NominationFileModel[],
  ) {
    return new Transparence(name, formations, nominationFiles);
  }
}
