import { z } from 'zod';
import { DomainRegistry } from '../../../transparences/business-logic/models/domain-registry';
import {
  NominationFileRead,
  nominationFileReadSchema,
} from './nomination-file-read';

export type NominationFileModelSnapshot = {
  id: string;
  createdAt: Date;
  rowNumber: NominationFileRead['rowNumber'];
  content: NominationFileRead['content'];
};

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
    this._nominationFileRead =
      nominationFileReadSchema.parse(nominationFileRead);
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
