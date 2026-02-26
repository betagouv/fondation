import { Magistrat } from 'shared-models';
import { DateOnly } from 'src/utils/date-only';
import { AutoAffectationWorkload } from './auto-affectation-file-workload';

describe(`auto affectation workload`, () => {
  const startOf2026 = DateOnly.fromJson({ day: 2, month: 1, year: 2026 });

  it('should init to zero', () => {
    expect(AutoAffectationWorkload.zero().toNumber()).toBe(0);
  });

  it.each`
    grade                 | expected
    ${Magistrat.Grade.G1} | ${1}
    ${Magistrat.Grade.G2} | ${2}
    ${Magistrat.Grade.G3} | ${3}
  `('workload for $grade should be $expected', ({ grade, expected }) => {
    const workload = AutoAffectationWorkload.from({
      grade,
      sessionDate: startOf2026,
    });

    expect(workload.toNumber()).toBe(expected);
  });

  it.each`
    grade                 | expected
    ${Magistrat.Grade.I}  | ${2}
    ${Magistrat.Grade.II} | ${1}
    ${Magistrat.Grade.HH} | ${3}
  `('workload for legacy $grade should be $expected', ({ grade, expected }) => {
    const workload = AutoAffectationWorkload.from({
      grade,
      sessionDate: DateOnly.fromJson({ day: 2, month: 1, year: 2025 }),
    });

    expect(workload.toNumber()).toBe(expected);
  });

  it.each`
    grade                  | sessionDate     | expected
    ${Magistrat.Grade.II}  | ${'2026-01-01'} | ${1}
    ${Magistrat.Grade.I}   | ${'2026-01-01'} | ${2}
    ${Magistrat.Grade.III} | ${'2026-01-01'} | ${3}
    ${Magistrat.Grade.HH}  | ${'2026-01-01'} | ${3}
    ${Magistrat.Grade.G1}  | ${'2025-01-01'} | ${1}
    ${Magistrat.Grade.G2}  | ${'2025-01-01'} | ${2}
    ${Magistrat.Grade.G3}  | ${'2025-01-01'} | ${3}
  `(
    'workload for incoherent $grade for $date should be $expected',
    ({ grade, sessionDate, expected }) => {
      const workload = AutoAffectationWorkload.from({
        grade,
        sessionDate: DateOnly.fromDate(new Date(sessionDate)),
      });
      expect(workload.toNumber()).toBe(expected);
    },
  );

  it('should init from multiple', () => {
    const workload = AutoAffectationWorkload.fromMultiple({
      sessionDate: startOf2026,
      count: 3,
      grade: Magistrat.Grade.G1,
    });

    expect(workload.toNumber()).toBe(3);
  });

  it('should add between workloads', () => {
    const workload = AutoAffectationWorkload.from({
      sessionDate: startOf2026,
      grade: Magistrat.Grade.G1,
    }).add(
      AutoAffectationWorkload.from({
        sessionDate: startOf2026,
        grade: Magistrat.Grade.G1,
      }),
    );

    expect(workload.toNumber()).toBe(2);
  });

  it('should sub between workloads', () => {
    const workload = AutoAffectationWorkload.from({
      sessionDate: startOf2026,
      grade: Magistrat.Grade.G1,
    }).sub(
      AutoAffectationWorkload.from({
        sessionDate: startOf2026,
        grade: Magistrat.Grade.G1,
      }),
    );

    expect(workload.toNumber()).toBe(0);
  });
});
