import { z } from 'zod';
import { CreateReportValidationError } from '../errors/create-report-validation.error';
import { ReportToCreate } from '../use-cases/report-creation/create-report.use-case';

export class CreateReportValidator {
  validate(report: ReportToCreate) {
    const rulesCount = Object.values(report.rules).reduce(
      (acc, group) => acc + Object.values(group).length,
      0,
    );

    try {
      z.number().min(21).max(21).parse(rulesCount);
    } catch (e) {
      throw new CreateReportValidationError(e);
    }
  }
}
