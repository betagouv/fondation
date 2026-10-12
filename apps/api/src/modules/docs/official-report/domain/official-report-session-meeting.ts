import { DateOnly } from 'src/utils/date-only';
import { TimeOnly, timeOnlyToDate } from 'src/utils/time-only';

export class OfficialReportSessionMeeting {
  private constructor(
    readonly date: DateOnly,
    readonly start: TimeOnly,
    readonly end: TimeOnly,
  ) {}

  equals(other: OfficialReportSessionMeeting): boolean {
    return (
      this.date.equals(other.date) &&
      OfficialReportSessionMeeting.timeOnlyEquals(this.start, other.start) &&
      OfficialReportSessionMeeting.timeOnlyEquals(this.end, other.end)
    );
  }

  scheduledOn(date: DateOnly): boolean {
    return this.date.equals(date);
  }

  startsAt(start: TimeOnly): boolean {
    return OfficialReportSessionMeeting.timeOnlyEquals(this.start, start);
  }

  endsAt(end: TimeOnly): boolean {
    return OfficialReportSessionMeeting.timeOnlyEquals(this.end, end);
  }

  private static timeOnlyEquals(a: TimeOnly, b: TimeOnly): boolean {
    return (['hours', 'minutes', 'seconds'] as const).every((prop) => a[prop] === b[prop]);
  }

  static from(props: {
    date: DateOnly;
    startTime: TimeOnly;
    endTime: TimeOnly;
  }): OfficialReportSessionMeeting {
    if (timeOnlyToDate(props.endTime).getTime() < timeOnlyToDate(props.startTime).getTime()) {
      throw new OfficialReportMeetingSessionEndingTimeBeforeStartingTime();
    }

    return new OfficialReportSessionMeeting(props.date, props.startTime, props.endTime);
  }
}

export class OfficialReportMeetingSessionEndingTimeBeforeStartingTime extends Error {}
