import { PrismaReportStateEnum } from 'src/generated/prisma/enums';
import { ReportStateEnum } from 'src/modules/shared/report-state.enum';
import { assertNever } from 'src/utils/assert-never';

export function reportStateToPrismaReportStateEnum(value: ReportStateEnum): PrismaReportStateEnum {
  switch (value) {
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'NEW':
      return 'NEW';
    case 'READY_TO_SUPPORT':
      return 'READY_TO_SUPPORT';
    case 'SUPPORTED':
      return 'SUPPORTED';
    default:
      return assertNever(value);
  }
}

export function prismaReportStateEnumToReportState(value: PrismaReportStateEnum): ReportStateEnum {
  switch (value) {
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'NEW':
      return 'NEW';
    case 'READY_TO_SUPPORT':
      return 'READY_TO_SUPPORT';
    case 'SUPPORTED':
      return 'SUPPORTED';
    default:
      return assertNever(value);
  }
}
