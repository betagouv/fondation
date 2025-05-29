import _ from 'lodash';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';
import { z } from 'zod';
import { Avancement } from './avancement';
import { DomainRegistry } from './domain-registry';
import { NominationFileRead } from './nomination-file-read';

export type NominationFileModelSnapshot = {
  id: string;
  createdAt: Date;
  rowNumber: NominationFileRead['rowNumber'];
  content: NominationFileRead['content'];
};

export type NominationFileUpdatedContent = Pick<
  NominationFileRead['content'],
  'folderNumber' | 'observers' | 'rules'
>;
export class NominationFileModel {
  private _nominationFileRead: NominationFileRead;
  private _createdAt: Date;

  private constructor(
    private readonly _id: string,
    _createdAt: Date,
    nominationFileRead: NominationFileRead,
  ) {
    this.setCreatedAt(_createdAt);
    this.setNominationFileRead(nominationFileRead);
  }

  updateFolderNumber(folderNumber: number) {
    this._nominationFileRead.content.folderNumber = folderNumber;
  }
  updateObservers(observers: string[]) {
    this._nominationFileRead.content.observers = observers;
  }
  updateRules(rules: NominationFileRead['content']['rules']) {
    this._nominationFileRead.content.rules = _.merge(
      this._nominationFileRead.content.rules,
      rules,
    );
  }
  updateDatePassageAuGrade(datePassageAuGrade: DateOnlyJson) {
    this._nominationFileRead.content.datePassageAuGrade = datePassageAuGrade;
  }
  updateDatePriseDeFonctionPosteActuel(
    datePriseDeFonctionPosteActuel: DateOnlyJson,
  ) {
    this._nominationFileRead.content.datePriseDeFonctionPosteActuel =
      datePriseDeFonctionPosteActuel;
  }
  updateAvancement(avancement: Avancement) {
    this._nominationFileRead.content.avancement = avancement;
  }
  updateInformationCarriere(informationCarriere: string) {
    this._nominationFileRead.content.informationCarrière = informationCarriere;
  }

  reporterNames() {
    return this._nominationFileRead.content.reporters;
  }

  toSnapshot(): NominationFileModelSnapshot {
    return {
      id: this.id,
      createdAt: this._createdAt,
      rowNumber: this._nominationFileRead.rowNumber,
      content: this._nominationFileRead.content,
    };
  }

  get id(): string {
    return this._id;
  }

  get rowNumber(): number {
    return this._nominationFileRead.rowNumber;
  }

  private setCreatedAt(_createdAt: Date) {
    this._createdAt = z.date().parse(_createdAt);
  }
  private setNominationFileRead(nominationFileRead: NominationFileRead) {
    // TODO - revalider avec zod après ajout des colonnes dans le tsv
    // nominationFileReadSchema.parse(nominationFileRead);
    this._nominationFileRead = nominationFileRead;
  }

  static fromSnapshot(
    snapshot: NominationFileModelSnapshot,
  ): NominationFileModel {
    return new NominationFileModel(snapshot.id, snapshot.createdAt, {
      rowNumber: snapshot.rowNumber,
      content: snapshot.content,
    });
  }

  static create(nominationFileRead: NominationFileRead) {
    const id = DomainRegistry.uuidGenerator().generate();
    const createdAt = DomainRegistry.dateTimeProvider().now();
    return new NominationFileModel(id, createdAt, nominationFileRead);
  }
}
