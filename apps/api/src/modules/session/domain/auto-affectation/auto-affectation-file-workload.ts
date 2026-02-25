import { Logger } from '@nestjs/common';
import { Magistrat } from 'shared-models';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';
import { AutoAffectations } from './auto-affectations';

export class AutoAffectationWorkload {
  private constructor(private readonly value: number) {}

  toNumber(): number {
    return this.value;
  }

  add({ value }: AutoAffectationWorkload): AutoAffectationWorkload {
    return new AutoAffectationWorkload(this.value + value);
  }

  sub({ value }: AutoAffectationWorkload): AutoAffectationWorkload {
    return new AutoAffectationWorkload(this.value - value);
  }

  static zero(): AutoAffectationWorkload {
    return new AutoAffectationWorkload(0);
  }

  static fromMultiple(props: {
    sessionDate: DateOnly;
    grade: Magistrat.Grade;
    count: number;
  }): AutoAffectationWorkload {
    return new AutoAffectationWorkload(this.from(props).value * props.count);
  }

  static from(props: {
    sessionDate: DateOnly;
    grade: Magistrat.Grade;
  }): AutoAffectationWorkload {
    return new AutoAffectationWorkload(this.compute(props));
  }

  private static compute(file: {
    sessionDate: DateOnly;
    grade: Magistrat.Grade;
  }): number {
    const logger = new Logger(AutoAffectations.name);

    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test' || process.env.CI) {
      logger.localInstance.setLogLevels?.([]);
    }

    if (this.isDeprecatedGrading(file)) {
      return this.getDeprecatedGrading(file);
    }

    switch (file.grade) {
      case Magistrat.Grade.G1:
        return 1;
      case Magistrat.Grade.G2:
        return 2;

      case Magistrat.Grade.G3:
      case Magistrat.Grade.G3SUP:
        return 3;

      case Magistrat.Grade.I: {
        logger.warn(
          `Received grade ${file.grade} for nomination session newer than 2025-12-01`,
        );
        return 2;
      }

      case Magistrat.Grade.II: {
        logger.warn(
          `Received grade ${file.grade} for nomination session newer than 2025-12-01`,
        );
        return 1;
      }

      case Magistrat.Grade.III:
      case Magistrat.Grade.HH: {
        logger.warn(
          `Received grade ${file.grade} for nomination session newer than 2025-12-01`,
        );
        return 3;
      }

      default:
        return assertNever(file.grade);
    }
  }

  private static isDeprecatedGrading(file: { sessionDate: DateOnly }): boolean {
    return file.sessionDate.toDate().getTime() < Date.UTC(2025, 11, 1);
  }

  private static getDeprecatedGrading(file: {
    grade: Magistrat.Grade;
  }): number {
    const logger = new Logger(AutoAffectations.name);

    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test' || process.env.CI) {
      logger.localInstance.setLogLevels?.([]);
    }

    switch (file.grade) {
      case Magistrat.Grade.II:
        return 1;
      case Magistrat.Grade.I:
        return 2;
      case Magistrat.Grade.HH:
        return 3;

      case Magistrat.Grade.G1: {
        logger.warn(
          `Received grade ${file.grade} for nomination session older than 2025-12-01`,
        );
        return 1;
      }
      case Magistrat.Grade.G2: {
        logger.warn(
          `Received grade ${file.grade} for nomination session older than 2025-12-01`,
        );
        return 2;
      }
      case Magistrat.Grade.G3:
      case Magistrat.Grade.G3SUP:
      case Magistrat.Grade.III: {
        logger.warn(
          `Received grade ${file.grade} for nomination session older than 2025-12-01`,
        );
        return 3;
      }
      default:
        return assertNever(file.grade);
    }
  }
}
