import { Magistrat, NominationFile, Transparency } from '@/shared-models';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';

export type NominationFileRead = {
  content: {
    name: string;
    formation: Magistrat.Formation;
    dueDate: DateOnlyJson | null;
    state:
      | NominationFile.ReportState.NEW
      | NominationFile.ReportState.OPINION_RETURNED;
    transparency: Transparency;
    reporter: string;
    grade: Magistrat.Grade;
    currentPosition: string;
    targettedPosition: string;
    rank: string;
    birthDate: DateOnlyJson;
    biography: string | null;
    rules: {
      [NominationFile.RuleGroup.MANAGEMENT]: {
        [key in NominationFile.ManagementRule]: boolean;
      };
      [NominationFile.RuleGroup.STATUTORY]: {
        [key in NominationFile.StatutoryRule]: boolean;
      };
      [NominationFile.RuleGroup.QUALITATIVE]: {
        [key in NominationFile.QualitativeRule]: boolean;
      };
    };
  };
};
export interface NominationFileRepository {
  nominationFiles: NominationFileRead[];

  save(nominationFileRead: NominationFileRead): Promise<void>;
}
