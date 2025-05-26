import { Magistrat } from 'shared-models';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { z } from 'zod';
import { DomainRegistry } from './domain-registry';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from './nomination-file';
import { NominationFilesContentReadCollection } from './nomination-files-read-collection';

export type TransparenceSnapshot = {
  id: string;
  createdAt: Date;
  name: string;
  formation: Magistrat.Formation;
  nominationFiles: NominationFileModelSnapshot[];
};

export class Transparence {
  private _formation: Magistrat.Formation;
  private _nominationFiles: Record<string, NominationFileModel>;

  private constructor(
    private readonly _id: string,
    private readonly _createdAt: Date,
    private _name: string,
    formation: Magistrat.Formation,
    nominationFiles: NominationFileModel[],
  ) {
    this.name = _name;
    this.formation = formation;
    this.nominationFiles = nominationFiles;
  }

  addNewNominationFiles(
    readCollection: NominationFilesContentReadCollection,
  ): NominationFilesContentReadCollection | null {
    const newNominationFiles = readCollection.newNominationFiles(
      this.nominationFiles.map((file) => file.toSnapshot()),
    );
    const newNominationFilesModels = newNominationFiles.toModels();
    this.nominationFiles = [
      ...this.nominationFiles,
      ...newNominationFilesModels,
    ];

    return newNominationFiles.hasNominationFiles() ? newNominationFiles : null;
  }

  nominationFilesEventPayload(
    nominationFiles: NominationFilesContentReadCollection,
    reporters: {
      [k: string]: UserDescriptorSerialized;
    },
  ) {
    return Object.values(this._nominationFiles)
      .filter((nominationFile) =>
        nominationFiles.hasRowNumber(nominationFile.rowNumber),
      )
      .map((nominationFile) => ({
        nominationFileId: nominationFile.id,
        content: {
          ...nominationFile.toSnapshot().content,
          reporterIds:
            nominationFile.reporterNames()?.map((reporter) => {
              const userReporter = reporters[reporter];
              if (!userReporter)
                throw new Error(`User for reporter ${reporter} not found`);

              return userReporter.userId;
            }) || null,
        },
      }));
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get name() {
    return this._name;
  }
  set name(name: string) {
    this._name = z.string().parse(name);
  }

  get formation(): Magistrat.Formation {
    return this._formation;
  }
  set formation(formation: Magistrat.Formation) {
    this._formation = z.nativeEnum(Magistrat.Formation).parse(formation);
  }

  get nominationFiles(): NominationFileModel[] {
    return Object.values(this._nominationFiles);
  }
  private set nominationFiles(nominationFiles: NominationFileModel[]) {
    const parsedNominationFiles = z
      .any()
      .array()
      .nonempty()
      .parse(nominationFiles);
    this._nominationFiles = z
      .record(z.string(), z.any())
      .parse(
        Object.fromEntries(
          parsedNominationFiles.map((nominationFile) => [
            nominationFile.id,
            nominationFile,
          ]),
        ),
      );
  }

  snapshot(): TransparenceSnapshot {
    return {
      id: this._id,
      name: this._name,
      createdAt: this._createdAt,
      formation: this._formation,
      nominationFiles: Object.values(this._nominationFiles).map((file) =>
        file.toSnapshot(),
      ),
    };
  }

  static fromSnapshot(snapshot: TransparenceSnapshot): Transparence {
    return new Transparence(
      snapshot.id,
      snapshot.createdAt,
      snapshot.name,
      snapshot.formation,
      snapshot.nominationFiles.map(NominationFileModel.fromSnapshot),
    );
  }

  static nouvelle(
    name: string,
    formation: Magistrat.Formation,
    nominationFiles: NominationFileModel[],
  ) {
    const id = DomainRegistry.uuidGenerator().generate();
    const createdAt = DomainRegistry.dateTimeProvider().now();
    return new Transparence(id, createdAt, name, formation, nominationFiles);
  }
}
