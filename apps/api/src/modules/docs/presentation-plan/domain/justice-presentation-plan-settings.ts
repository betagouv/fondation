import { DateOnly } from '../../../../utils/date-only';
import { TimeOnly } from '../../../../utils/time-only';

export type PlainJusticePresentationPlanSettings = {
  agendas: readonly { comment: string | null; id: string }[];
  chairmanId: string | null;
  date: DateOnly;
  hasRenunciation: boolean;
  justiceContactId: string;
  members: readonly { id: string; isAbsent: boolean }[];
  secretaryId: string | null;
  time: TimeOnly;
};

export class JusticePresentationPlanSettings {
  private constructor(private readonly plain: PlainJusticePresentationPlanSettings) {}

  get chairmanId(): string | null {
    return this.plain.chairmanId;
  }

  get members(): readonly { id: string; isAbsent: boolean }[] {
    return this.plain.members;
  }

  static from(plain: PlainJusticePresentationPlanSettings): JusticePresentationPlanSettings {
    return new JusticePresentationPlanSettings(plain);
  }

  // TODO: see PresentationPlanProvider.isUnchanged
  equals(other: JusticePresentationPlanSettings): boolean {
    const { plain: mine } = this;
    const { plain: theirs } = other;

    return (
      mine.chairmanId === theirs.chairmanId &&
      mine.secretaryId === theirs.secretaryId &&
      mine.justiceContactId === theirs.justiceContactId &&
      mine.hasRenunciation === theirs.hasRenunciation &&
      mine.date.equals(theirs.date) &&
      mine.time.hours === theirs.time.hours &&
      mine.time.minutes === theirs.time.minutes &&
      mine.time.seconds === theirs.time.seconds &&
      sameEntries(mine.agendas, theirs.agendas, ({ comment }) => comment) &&
      sameEntries(mine.members, theirs.members, ({ isAbsent }) => isAbsent)
    );
  }
}

function sameEntries<T extends { id: string }>(
  mine: readonly T[],
  theirs: readonly T[],
  valueOf: (entry: T) => string | boolean | null,
): boolean {
  if (mine.length !== theirs.length) return false;

  const byId = new Map(theirs.map((entry) => [entry.id, entry]));

  return mine.every((entry) => {
    const other = byId.get(entry.id);
    return other !== undefined && valueOf(other) === valueOf(entry);
  });
}
