import { Magistrat } from 'shared-models';
import { DomainRegistry } from './domain-registry';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from './nomination-file';

export type TransparenceSnapshot = {
  id: string;
  name: string;
  formations: Magistrat.Formation[];
  nominationFiles: NominationFileModelSnapshot[];
};

export class Transparence {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _formations: Magistrat.Formation[],
    private readonly _nominationFiles: NominationFileModel[] = [],
  ) {}

  get id(): string {
    return this._id;
  }

  get nominationFiles(): NominationFileModel[] {
    return [...this._nominationFiles];
  }

  snapshot(): TransparenceSnapshot {
    return {
      id: this._id,
      name: this._name,
      formations: this._formations,
      nominationFiles: this._nominationFiles.map((file) => file.toSnapshot()),
    };
  }

  addNominationFile(nominationFile: NominationFileModel): void {
    this._nominationFiles.push(nominationFile);
  }

  addNominationFiles(nominationFiles: NominationFileModel[]): void {
    this._nominationFiles.push(...nominationFiles);
  }

  static nouvelle(
    name: string,
    formations: Magistrat.Formation[],
    nominationFiles: NominationFileModel[] = [],
  ) {
    const transparenceId = DomainRegistry.uuidGenerator().generate();
    return new Transparence(transparenceId, name, formations, nominationFiles);
  }

  static fromSnapshot(snapshot: TransparenceSnapshot): Transparence {
    return new Transparence(
      snapshot.id,
      snapshot.name,
      snapshot.formations,
      snapshot.nominationFiles.map(NominationFileModel.fromSnapshot),
    );
  }
}
