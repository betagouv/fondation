import { type AuditionSchedule, auditionScheduleKey } from 'src/utils/audition-schedule';

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

  equals(other: PublishableAuditions): boolean {
    return (
      sameEntries(
        this.nominationFiles,
        other.nominationFiles,
        ({ audition, requested }) => `${audition ? auditionScheduleKey(audition) : ''}|${requested}`,
      ) && sameEntries(this.observants, other.observants, auditionScheduleKey)
    );
  }
}

function sameEntries<T>(a: ReadonlyMap<string, T>, b: ReadonlyMap<string, T>, keyOf: (value: T) => string) {
  if (a.size !== b.size) return false;

  return [...a].every(([id, value]) => {
    const other = b.get(id);
    return other !== undefined && keyOf(other) === keyOf(value);
  });
}
