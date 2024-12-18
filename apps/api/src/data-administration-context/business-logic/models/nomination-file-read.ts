import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';

export type NominationFileRead = {
  rowNumber: number;
  content: {
    folderNumber: number | null;
    name: string;
    formation: Magistrat.Formation;
    dueDate: DateOnlyJson | null;
    state:
      | NominationFile.ReportState.NEW
      | NominationFile.ReportState.SUPPORTED;
    transparency: Transparency;
    reporters: string[] | null;
    grade: Magistrat.Grade;
    currentPosition: string;
    targettedPosition: string;
    rank: string;
    birthDate: DateOnlyJson;
    biography: string | null;
    observers: string[] | null;
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
