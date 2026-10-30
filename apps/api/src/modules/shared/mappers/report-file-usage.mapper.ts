import { PrismaReportFileUsageEnum } from '../../../generated/prisma/enums';
import { assertNever } from '../../../utils/assert-never';
import { ReportFileUsageEnum } from '../report-file-usage.enum';

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
