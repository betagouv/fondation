import { NominationFile } from 'shared-models';

import { PrismaReportStateEnum } from 'src/generated/prisma/enums';
import { assertNever } from 'src/utils/assert-never';

export function reportStateToPrismaReportStateEnum(value: NominationFile.ReportState): PrismaReportStateEnum {
  switch (value) {
    case NominationFile.ReportState.IN_PROGRESS:
      return 'IN_PROGRESS';
    case NominationFile.ReportState.NEW:
      return 'NEW';
    case NominationFile.ReportState.READY_TO_SUPPORT:
      return 'READY_TO_SUPPORT';
    case NominationFile.ReportState.SUPPORTED:
      return 'SUPPORTED';
    default:
      return assertNever(value);
  }
}

export function prismaReportStateEnumToReportState(value: PrismaReportStateEnum): NominationFile.ReportState {
  switch (value) {
    case 'IN_PROGRESS':
      return NominationFile.ReportState.IN_PROGRESS;
    case 'NEW':
      return NominationFile.ReportState.NEW;
    case 'READY_TO_SUPPORT':
      return NominationFile.ReportState.READY_TO_SUPPORT;
    case 'SUPPORTED':
      return NominationFile.ReportState.SUPPORTED;
    default:
      return assertNever(value);
  }
}
