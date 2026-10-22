import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { fullname } from '../../../../../utils/user.util';
import { Db } from '../../../../framework/database';
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';
import { EditedOfficialReportFileNoteDto } from '../official-reports.dto';

@Injectable()
export class DetailsOfficialReportFileNoteQuery {
  constructor(
    private readonly db: Db,
    private readonly officialReportVersionFinder: OfficialReportVersionFinder,
  ) {}

  @Transactional()
  async handle(query: {
    nominationFileId: string;
    officialReportId: string;
  }): Promise<EditedOfficialReportFileNoteDto> {
    const file = await this.db.tx.officialReportNominationFile.findFirst({
      select: {
        note: true,
        noteEditedAt: true,
        noteEditor: { select: { firstName: true, id: true, lastName: true } },
      } satisfies Prisma.OfficialReportNominationFileSelect,
      where: {
        nominationFileId: query.nominationFileId,
        versionId: await this.officialReportVersionFinder.latest(query),
      },
    });

    if (!file?.note) throw new NotFoundException();

    return {
      editedAt: file.noteEditedAt?.toISOString() ?? null,
      editedBy: file.noteEditor ? { id: file.noteEditor.id, name: fullname(file.noteEditor) } : null,
      html: file.note,
    };
  }
}
