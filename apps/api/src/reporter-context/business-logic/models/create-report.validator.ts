import typia from 'typia';
import { Maximum, Minimum } from 'typia/lib/tags';
import { CreateReportPayload } from '../use-cases/report-creation/create-report.use-case';
import { CreateReportValidationError } from '../errors/create-report-validation.error';

type NumberEquals<T extends number> = number & Minimum<T> & Maximum<T>;

export class CreateReportValidator {
  validate(report: CreateReportPayload) {
    const rulesCount = Object.values(report.rules).reduce(
      (acc, group) => acc + Object.values(group).length,
      0,
    );

    try {
      typia.assert<NumberEquals<21>>(rulesCount);
    } catch (e) {
      throw new CreateReportValidationError(e);
    }
  }
}
