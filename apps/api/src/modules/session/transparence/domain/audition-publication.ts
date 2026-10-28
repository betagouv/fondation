import { type AuditionSchedule, auditionScheduleKey } from '../../../../utils/audition-schedule';

type NominationFileAudition = { audition: AuditionSchedule | null; requested: boolean | null };

export class PublishableAuditions {
  private constructor(
    readonly nominationFiles: ReadonlyMap<string, NominationFileAudition>,
    readonly observants: ReadonlyMap<string, AuditionSchedule>,
  ) {}

  static from(props: {
    nominationFiles: ReadonlyMap<string, NominationFileAudition>;
    observants: ReadonlyMap<string, AuditionSchedule>;
  }): PublishableAuditions {
    return new PublishableAuditions(props.nominationFiles, props.observants);
  }

  // the members see an audition request right away: only the dates wait for a publication
  equals(other: PublishableAuditions): boolean {
    return (
      sameEntries(scheduled(this.nominationFiles), scheduled(other.nominationFiles), auditionScheduleKey) &&
      sameEntries(this.observants, other.observants, auditionScheduleKey)
    );
  }
}

function scheduled(files: ReadonlyMap<string, NominationFileAudition>): Map<string, AuditionSchedule> {
  return new Map([...files].flatMap(([id, { audition }]) => (audition ? [[id, audition] as const] : [])));
}

function sameEntries<T>(a: ReadonlyMap<string, T>, b: ReadonlyMap<string, T>, keyOf: (value: T) => string) {
  if (a.size !== b.size) return false;

  return [...a].every(([id, value]) => {
    const other = b.get(id);
    return other !== undefined && keyOf(other) === keyOf(value);
  });
}
