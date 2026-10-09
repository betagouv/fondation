import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { SessionReportedFilesFinder } from './session-reported-files.finder';

@Injectable()
export class ReportedSessionsFinder {
  constructor(private readonly reportedFiles: SessionReportedFilesFinder) {}

  @Transactional()
  async reportedSessionIds(query: { sessionIds: readonly string[] }): Promise<Set<string>> {
    const unreported = await this.reportedFiles.unreportedCountBySession(query);

    return new Set(query.sessionIds.filter((sessionId) => !unreported.has(sessionId)));
  }

  @Transactional()
  async unreportedFilesCount(query: { sessionId: string }): Promise<number> {
    const unreported = await this.reportedFiles.unreportedCountBySession({ sessionIds: [query.sessionId] });

    return unreported.get(query.sessionId) ?? 0;
  }
}
