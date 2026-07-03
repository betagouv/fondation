import { faker } from '@faker-js/faker';

import { Gender, Magistrat } from 'shared-models';

import { DateOnly } from 'src/utils/date-only';

import { Agenda, EmptyAgenda } from './agenda';

describe('Agenda', () => {
  const props = Object.freeze({
    authorId: 'author-1',
    chairman: {
      id: 'chairman-1',
      title: null,
      displayTitle: null,
      gender: Gender.M,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    },
    date: DateOnly.fromJson({ day: 2, month: 2, year: 2026 }),
    nominationFiles: [
      {
        id: 'nf-1',
        number: 1,
        reporters: [],
        currentPosition: faker.lorem.sentence(10),
        grade: Magistrat.Grade.G3,
        name: faker.person.fullName(),
        outcome: { value: 'VALIDATED', comment: null },
        targetedGrade: Magistrat.Grade.G3,
        targetedPosition: faker.lorem.sentence(10),
      },
    ],
    sessionId: 'session-1',
    sessionMeetingDate: DateOnly.fromJson({ day: 10, month: 2, year: 2026 }),
  } as const satisfies Parameters<(typeof Agenda)['create']>[0]);

  it('should prevent creating an agenda without files', () => {
    const act = () =>
      Agenda.create({
        ...props,
        nominationFiles: [],
      });

    expect(act).toThrow(EmptyAgenda);
  });
});
