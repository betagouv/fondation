import { DateOnlyJson, Magistrat } from 'shared-models';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { dateOnlyJsonSchema } from 'src/shared-kernel/business-logic/models/date-only';
import { z } from 'zod';
import { DomainRegistry } from '../../../transparences/business-logic/models/domain-registry';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from './nomination-file';
import { NominationFilesContentReadCollection } from './nomination-files-read-collection';
import { TransparenceXlsxObservantsImportésEvent } from './events/transparence-xlsx-observants-importés.event';

export type TransparenceSnapshot = {
  id: string;
  createdAt: Date;
  name: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnlyJson;
  dateEchéance: DateOnlyJson | null;
  datePriseDePosteCible: DateOnlyJson | null;
  dateClôtureDélaiObservation: DateOnlyJson;
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
    private _dateTransparence: DateOnlyJson,
    private _dateEchéance: DateOnlyJson | null,
    private _datePriseDePosteCible: DateOnlyJson | null,
    private _dateClôtureDélaiObservation: DateOnlyJson,

    nominationFiles: NominationFileModel[],
  ) {
    this.name = _name;
    this.formation = formation;
    this.nominationFiles = nominationFiles;
    this.setDateTransparence(_dateTransparence);
    this.setDateEchéance(_dateEchéance);
    this.setDatePriseDePosteCible(_datePriseDePosteCible);
    this.setDateClôtureDélaiObservation(_dateClôtureDélaiObservation);
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

  updateObservants(readCollection: NominationFilesContentReadCollection) {
    const observantsDesDossiers = this.nominationFiles
      .map((nominationFile) =>
        readCollection
          .observants()
          .map(({ rowNumber, observants: rowObservants }) => {
            const observants = nominationFile.updateObservants(
              rowNumber,
              rowObservants,
            );
            return {
              dossierId: nominationFile.id,
              observants,
            };
          }),
      )
      .flat();

    return TransparenceXlsxObservantsImportésEvent.create({
      transparenceId: this.id,
      dossiersDeNominations: observantsDesDossiers,
    });
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
      .map((nominationFile) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { reporters: unusedReporters, ...content } =
          nominationFile.toSnapshot().content;

        return {
          nominationFileId: nominationFile.id,
          content: {
            ...content,
            reporterIds:
              nominationFile.reporterNames()?.map((reporter) => {
                const userReporter = reporters[reporter];
                if (!userReporter) {
                  throw new Error(`User for reporter ${reporter} not found`);
                }

                return userReporter.userId;
              }) || null,
          },
        };
      });
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
  setDateEchéance(_dateEchéance: DateOnlyJson | null) {
    this._dateEchéance = dateOnlyJsonSchema.nullable().parse(_dateEchéance);
  }
  setDateTransparence(_dateTransparence: DateOnlyJson) {
    this._dateTransparence = dateOnlyJsonSchema.parse(_dateTransparence);
  }
  setDatePriseDePosteCible(_datePriseDePosteCible: DateOnlyJson | null) {
    this._datePriseDePosteCible = dateOnlyJsonSchema
      .nullable()
      .parse(_datePriseDePosteCible);
  }
  setDateClôtureDélaiObservation(_dateClôtureDélaiObservation: DateOnlyJson) {
    this._dateClôtureDélaiObservation = dateOnlyJsonSchema.parse(
      _dateClôtureDélaiObservation,
    );
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
      dateEchéance: this._dateEchéance,
      dateTransparence: this._dateTransparence,
      datePriseDePosteCible: this._datePriseDePosteCible,
      dateClôtureDélaiObservation: this._dateClôtureDélaiObservation,
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
      snapshot.dateTransparence,
      snapshot.dateEchéance,
      snapshot.datePriseDePosteCible,
      snapshot.dateClôtureDélaiObservation,
      snapshot.nominationFiles.map(NominationFileModel.fromSnapshot),
    );
  }

  static nouvelle(
    name: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
    dateEchéance: DateOnlyJson | null,
    datePriseDePosteCible: DateOnlyJson | null,
    dateClôtureDélaiObservation: DateOnlyJson,
    nominationFiles: NominationFileModel[],
  ) {
    const id = DomainRegistry.uuidGenerator().generate();
    const createdAt = DomainRegistry.dateTimeProvider().now();
    return new Transparence(
      id,
      createdAt,
      name,
      formation,
      dateTransparence,
      dateEchéance,
      datePriseDePosteCible,
      dateClôtureDélaiObservation,
      nominationFiles,
    );
  }
}
