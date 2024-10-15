import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

export type NominationFileRead = {
  content: {
    dueDate: DateOnly | null;
    birthDate: DateOnly;
  };
};
export interface NominationFileRepository {
  nominationFiles: NominationFileRead[];

  save(nominationFileRead: NominationFileRead): Promise<void>;
}
