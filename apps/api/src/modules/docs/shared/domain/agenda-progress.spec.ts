import { agendaProgressOf } from './agenda-progress';

const decided = { hasAnyReporter: true, hasOutcome: true, isAffected: true };

describe('agendaProgressOf', () => {
  it('should report an agenda whose files are all decided and affected', () => {
    expect(agendaProgressOf([decided, decided])).toEqual({
      filesCount: 2,
      filesWithoutOutcome: 0,
      filesWithoutReporter: 0,
      filesWithUnpublishedReporter: 0,
      isReportable: true,
    });
  });

  it('should count a file without outcome', () => {
    expect(agendaProgressOf([decided, { ...decided, hasOutcome: false }])).toMatchObject({
      filesWithoutOutcome: 1,
      isReportable: false,
    });
  });

  it('should tell a file never affected from one affected in an unpublished version', () => {
    expect(
      agendaProgressOf([
        { hasAnyReporter: false, hasOutcome: true, isAffected: false },
        { hasAnyReporter: true, hasOutcome: true, isAffected: false },
      ]),
    ).toMatchObject({ filesWithoutReporter: 1, filesWithUnpublishedReporter: 1, isReportable: false });
  });

  it('should not report an agenda holding a file taken off its session', () => {
    expect(agendaProgressOf([decided, null])).toEqual({
      filesCount: 1,
      filesWithoutOutcome: 0,
      filesWithoutReporter: 0,
      filesWithUnpublishedReporter: 0,
      isReportable: false,
    });
  });
});
