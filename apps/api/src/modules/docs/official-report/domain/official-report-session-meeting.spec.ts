import { DateOnly } from 'src/utils/date-only';

import {
  OfficialReportMeetingSessionEndingTimeBeforeStartingTime,
  OfficialReportSessionMeeting,
} from './official-report-session-meeting';

describe('OfficialReportSessionMeeting', () => {
  it('should prevent creating a session with ending time before starting time', () => {
    expect(() =>
      OfficialReportSessionMeeting.from({
        date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
        startTime: { hours: 18, minutes: 10, seconds: 0 },
        endTime: { hours: 18, minutes: 0, seconds: 0 },
      }),
    ).toThrow(OfficialReportMeetingSessionEndingTimeBeforeStartingTime);
  });

  it('should compare 2 session meeting', () => {
    const meeting1 = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    const meeting2 = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    expect(meeting1.equals(meeting2)).toBe(true);
  });

  it('should compare 2 session meeting, and be false, when the date is different', () => {
    const meeting1 = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    const meeting2 = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 4, day: 11 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    expect(meeting1.equals(meeting2)).toBe(false);
  });

  it('should compare 2 session meeting, and be false, when the starting time is different', () => {
    const meeting1 = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    const meeting2 = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
      startTime: { hours: 17, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    expect(meeting1.equals(meeting2)).toBe(false);
  });

  it('should compare 2 session meeting, and be false, when the ending time is different', () => {
    const meeting1 = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    const meeting2 = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 20, seconds: 0 },
    });

    expect(meeting1.equals(meeting2)).toBe(false);
  });

  it('should query the ending time', () => {
    const meeting = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    expect(meeting.endsAt({ hours: 18, minutes: 10, seconds: 0 })).toBe(true);
    expect(meeting.endsAt({ hours: 18, minutes: 10, seconds: 10 })).toBe(false);
  });
});
