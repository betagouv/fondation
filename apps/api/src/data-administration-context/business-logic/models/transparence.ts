import { Magistrat, Transparency } from 'shared-models';
import { z } from 'zod';
import { Affectation, NominationFileAffectation } from './affectation';
import { DomainRegistry } from './domain-registry';
import { GdsTransparenceNominationFilesModifiedEvent } from './events/gds-transparence-nomination-files-modified.event';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from './nomination-file';
import { NominationFilesContentReadCollection } from './nomination-files-read-collection';
import { NominationFilesUpdatedCollection } from './nomination-files-updated-collection';

export type TransparenceSnapshot = {
  id: string;
  createdAt: Date;
  name: Transparency;
  formations: Set<Magistrat.Formation>;
  nominationFiles: NominationFileModelSnapshot[];
};

export class Transparence {
  private _formations: Set<Magistrat.Formation>;
  private _nominationFiles: Record<string, NominationFileModel>;

  private constructor(
    private readonly _id: string,
    private readonly _createdAt: Date,
    private _name: Transparency,
    _formations: Set<Magistrat.Formation>,
    _nominationFiles: NominationFileModel[],
  ) {
    this.name = _name;
    this.formations = _formations;
    this.nominationFiles = _nominationFiles;
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

  replaceModifiedNominationFiles(
    readCollection: NominationFilesContentReadCollection,
  ): GdsTransparenceNominationFilesModifiedEvent | null {
    const updatedNominationFilesFields = readCollection.updatedNominationFiles(
      this.nominationFiles.map((file) => file.toSnapshot()),
    );

    const [updatedNominationFiles, nominationFilesUpdatedEvent] =
      new NominationFilesUpdatedCollection(
        this.nominationFiles.map((file) => file.toSnapshot()),
        this._id,
        this._name,
      ).updateNominationFiles(updatedNominationFilesFields);

    this.nominationFiles = [...this.nominationFiles, ...updatedNominationFiles];

    return updatedNominationFiles.length > 0
      ? nominationFilesUpdatedEvent
      : null;
  }

  replaceFormations(readCollection: NominationFilesContentReadCollection) {
    this.formations = readCollection.formations();
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get name(): Transparency {
    return this._name;
  }
  set name(name: Transparency) {
    this._name = z.nativeEnum(Transparency).parse(name);
  }

  get formations(): Set<Magistrat.Formation> {
    return this._formations;
  }
  set formations(formations: Set<Magistrat.Formation>) {
    this._formations = z
      .set(z.nativeEnum(Magistrat.Formation))
      .nonempty()
      .max(2)
      .parse(new Set(formations));
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
      formations: this._formations,
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
      snapshot.formations,
      snapshot.nominationFiles.map(NominationFileModel.fromSnapshot),
    );
  }

  static nouvelle(
    name: Transparency,
    formations: Set<Magistrat.Formation>,
    nominationFiles: NominationFileModel[],
  ) {
    const id = DomainRegistry.uuidGenerator().generate();
    const createdAt = DomainRegistry.dateTimeProvider().now();
    return new Transparence(id, createdAt, name, formations, nominationFiles);
  }

  affecterRapporteurs(
    nominationFilesAffectations: NominationFileAffectation[],
  ) {
    return new Affectation(
      this._id,
      this._formations,
      nominationFilesAffectations,
    );
  }
}
