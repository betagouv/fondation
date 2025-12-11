import { ReportFileUsage } from 'shared-models';
import { PrismaReportFileUsageEnum } from 'src/generated/prisma/enums';
import { assertNever } from 'src/utils/assert-never';

export function prismaReportFileUsageEnumToReportFileUsage(
  value: PrismaReportFileUsageEnum,
): ReportFileUsage {
  switch (value) {
    case 'ATTACHMENT':
      return ReportFileUsage.ATTACHMENT;
    case 'EMBEDDED_SCREENSHOT':
      return ReportFileUsage.EMBEDDED_SCREENSHOT;
    default:
      return assertNever(value);
  }
}

export function reportFileUsageToPrismaReportFileUsageEnum(
  value: PrismaReportFileUsageEnum,
): ReportFileUsage {
  switch (value) {
    case 'ATTACHMENT':
      return ReportFileUsage.ATTACHMENT;
    case 'EMBEDDED_SCREENSHOT':
      return ReportFileUsage.EMBEDDED_SCREENSHOT;
    default:
      return assertNever(value);
  }
}
