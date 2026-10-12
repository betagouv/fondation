export const NOMINATION_SESSION_FILE_STATUSES = ['TO_REPORT', 'DSJ_PLANNED', 'DSJ_REPORTED'] as const;

export type NominationSessionFileStatusEnum = (typeof NOMINATION_SESSION_FILE_STATUSES)[number];

export type NominationSessionFileStatus = {
  dates: Date[];
  value: NominationSessionFileStatusEnum;
};

type LinkedDoc = {
  agenda: { sessionMeetingDate: Date };
  officialReport: { isValidated: boolean; sessionMeetingDate: Date } | null;
};

/**
 * the outcome is left out on purpose: changing it must not move the status, only a new document does.
 * Whether a file is done (locked, counted as reported) is another rule, see SessionReportedFilesFinder
 */
export function transparenceFileStatus(file: { docs: readonly LinkedDoc[] }): NominationSessionFileStatus {
  const latestDocs = ofLatestMeeting(file.docs);

  const reported = latestDocs.flatMap((doc) =>
    doc.officialReport?.isValidated ? [doc.officialReport.sessionMeetingDate] : [],
  );
  if (reported.length > 0) return { dates: mostRecentFirst(reported), value: 'DSJ_REPORTED' };

  const planned = latestDocs.map((doc) => doc.agenda.sessionMeetingDate);
  if (planned.length > 0) return { dates: mostRecentFirst(planned), value: 'DSJ_PLANNED' };

  return { dates: [], value: 'TO_REPORT' };
}

function ofLatestMeeting(docs: readonly LinkedDoc[]): LinkedDoc[] {
  const latestTime = Math.max(...docs.map((doc) => doc.agenda.sessionMeetingDate.getTime()));
  return docs.filter((doc) => doc.agenda.sessionMeetingDate.getTime() === latestTime);
}

function mostRecentFirst(dates: readonly Date[]): Date[] {
  const byTime = new Map(dates.map((date) => [date.getTime(), date]));
  return [...byTime.values()].sort((a, b) => b.getTime() - a.getTime());
}
