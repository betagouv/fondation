import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NominationFileModel } from '../../../../../../business-logic/models/nomination-file';
import { NominationFileRead } from '../../../../../../business-logic/models/nomination-file-read';

@Entity({ schema: 'data_administrator_context', name: 'nomination_files' })
export class NominationFilePm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int4', { name: 'row_number' })
  rowNumber: number;

  @Column('uuid', { name: 'report_id', nullable: true })
  reportId: string | null;

  @Column('jsonb')
  content: NominationFileRead['content'];

  constructor(
    id: string,
    rowNumber: number,
    reportId: string | null,
    content: NominationFileRead['content'],
  ) {
    this.id = id;
    this.rowNumber = rowNumber;
    this.reportId = reportId;
    this.content = content;
  }

  static fromDomain(nominationFile: NominationFileModel): NominationFilePm {
    const nominationFileSnapshot = nominationFile.toSnapshot();
    return new NominationFilePm(
      nominationFileSnapshot.id,
      nominationFileSnapshot.rowNumber,
      nominationFileSnapshot.reportId,
      nominationFileSnapshot.content,
    );
  }
}
