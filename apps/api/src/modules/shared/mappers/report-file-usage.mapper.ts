import { PrismaReportFileUsageEnum } from 'src/generated/prisma/enums';
import { ReportFileUsageEnum } from 'src/modules/shared/report-file-usage.enum';
import { assertNever } from 'src/utils/assert-never';

export function prismaReportFileUsageEnumToReportFileUsage(
  value: PrismaReportFileUsageEnum,
): ReportFileUsageEnum {
  switch (value) {
    case 'ATTACHMENT':
      return 'ATTACHMENT';
    case 'EMBEDDED_SCREENSHOT':
      return 'EMBEDDED_SCREENSHOT';
    default:
      return assertNever(value);
  }
}
