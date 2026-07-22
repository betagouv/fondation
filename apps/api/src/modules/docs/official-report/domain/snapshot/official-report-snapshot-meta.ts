import type { OfficialReportAgenda } from '../official-report-agenda';
import type { OfficialReportChairman } from '../official-report-chairman';
import type { OfficialReportMembersList } from '../official-report-member-list';
import type { OfficialReportSecretary } from '../official-report-secretary';
import type { OfficialReportSessionMeeting } from '../official-report-session-meeting';
import type { OfficialReportSnapshotDiff, UpdateOfficialReportCommand } from '../official-report-types';
import { assertIsDefined } from 'src/utils/is-defined';

import type {
  PlainOfficialReportSnapshot,
  PlainOfficialReportSnapshotManuallyEditedParts,
} from './official-report-snapshot';

export class OfficialReportSnapshotMeta {
  get justiceDepartmentContactId(): bigint {
    return assertIsDefined(this._justiceDepartmentContactId, `unknown justice contact`);
  }

  constructor(
    readonly hasRenunciation: boolean,
    readonly agenda: OfficialReportAgenda,
    private readonly _justiceDepartmentContactId: bigint | null,
    readonly sessionMeeting: OfficialReportSessionMeeting,
    readonly chairman: OfficialReportChairman,
    readonly secretary: OfficialReportSecretary,
    readonly members: OfficialReportMembersList,
    readonly manuallyEditedParts: PlainOfficialReportSnapshotManuallyEditedParts,
  ) {}

  diff(next: UpdateOfficialReportCommand['officialReport']): OfficialReportSnapshotDiff {
    const intro = this.introChanged(next) ? 'OUTDATED' : 'NOOP';
    const conclusion = this.conclusionChanged(next) ? 'OUTDATED' : 'NOOP';
    return {
      intro,
      conclusion,
      hasAny: intro === 'OUTDATED' || conclusion === 'OUTDATED',

      files: [],
    };
  }

  private introChanged(next: UpdateOfficialReportCommand['officialReport']): boolean {
    const introEqual =
      this.hasRenunciation === next.hasRenunciation &&
      this._justiceDepartmentContactId === next.justiceDepartmentContactId &&
      this.members.equals(next.members) &&
      this.sessionMeeting.scheduledOn(next.sessionMeeting.date) &&
      this.sessionMeeting.startsAt(next.sessionMeeting.start) &&
      this.chairman.id === next.chairman.id &&
      this.secretary.id === next.secretary.id;

    return this.manuallyEditedParts.intro && !introEqual;
  }

  private conclusionChanged(next: UpdateOfficialReportCommand['officialReport']): boolean {
    const conclusionEqual =
      this.sessionMeeting.endsAt(next.sessionMeeting.end) &&
      this.secretary.id == next.secretary.id &&
      this.chairman.id == next.chairman.id;

    return this.manuallyEditedParts.conclusion && !conclusionEqual;
  }

  static from(props: Omit<PlainOfficialReportSnapshot, 'files'>) {
    return new OfficialReportSnapshotMeta(
      props.hasRenunciation,
      props.agenda,
      props.justiceDepartmentContactId,
      props.sessionMeeting,
      props.chairman,
      props.secretary,
      props.members,
      props.manuallyEditedPart,
    );
  }
}
