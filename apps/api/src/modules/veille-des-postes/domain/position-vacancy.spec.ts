import { DateOnly } from '../../../utils/date-only';

import {
  hasLapsed,
  MissingReasonDetail,
  NoDeclaredVacancy,
  PositionVacancy,
  PositionVacancyDeclared,
  PositionVacancyWithdrawn,
  UnknownVacancyAttachment,
} from './position-vacancy';

const declaration = {
  authorId: 'author',
  fileIds: [],
  reasonDetail: null,
  startDate: new DateOnly(2027, 3, 1),
};

function vacancy(attachmentIds: readonly string[] | null) {
  return PositionVacancy.from({ attachmentIds, magistratId: 'magistrat', positionId: 7 });
}

describe('hasLapsed', () => {
  it.each([
    [{ currentPositionId: '7', status: 'INACTIVE' }, true],
    [{ currentPositionId: '8', status: 'ACTIVE' }, true],
    [{ currentPositionId: '7', status: 'ACTIVE' }, false],
    [{ currentPositionId: '007', status: 'ACTIVE' }, false],
    [{ currentPositionId: ' 7', status: 'ACTIVE' }, false],
    [{ currentPositionId: null, status: 'ACTIVE' }, true],
    [{ currentPositionId: '', status: 'ACTIVE' }, true],
  ])('tells whether a vacancy of a magistrat %j has lapsed: %s', (magistrat, lapsed) => {
    expect(hasLapsed({ positionId: 7 }, magistrat)).toBe(lapsed);
  });
});

describe('PositionVacancy', () => {
  it('asks a detail for the reason "other"', () => {
    expect(() => vacancy(null).declare({ ...declaration, reason: 'OTHER', reasonDetail: '  ' })).toThrow(
      MissingReasonDetail,
    );
  });

  it('drops the detail of another reason than "other"', () => {
    const declared = vacancy(null);

    declared.declare({ ...declaration, reason: 'RETIREMENT', reasonDetail: 'à sa demande' });

    expect(declared.messages).toEqual([
      new PositionVacancyDeclared('author', [], 'magistrat', 7, 'RETIREMENT', null, declaration.startDate),
    ]);
  });

  it('only acts on its own attachments', () => {
    expect(() => vacancy(['file']).removeAttachment('other')).toThrow(UnknownVacancyAttachment);
  });

  it('withdraws a declared vacancy', () => {
    const declared = vacancy([]);

    declared.withdraw();

    expect(declared.messages).toEqual([new PositionVacancyWithdrawn('magistrat', 7)]);
  });

  it('withdraws nothing when no vacancy is declared', () => {
    expect(() => vacancy(null).withdraw()).toThrow(NoDeclaredVacancy);
  });
});
