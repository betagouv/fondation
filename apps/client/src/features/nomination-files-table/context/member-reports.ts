import type { ListedMemberSessionReportsDto } from '@api/types';

export type MemberReport = ListedMemberSessionReportsDto['items'][number]['report'];

export class MemberReports {
  private constructor(private readonly reportsByNominationFileId: ReadonlyMap<string, MemberReport>) {}

  static fromReports(items: ListedMemberSessionReportsDto['items']): MemberReports {
    return new MemberReports(
      new Map(items.map(({ nominationFileId, report }) => [nominationFileId, report])),
    );
  }

  reportFor(nominationFileId: string): MemberReport | undefined {
    return this.reportsByNominationFileId.get(nominationFileId);
  }
}
