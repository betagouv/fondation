import { DateOnly } from '../../../utils/date-only';

import {
  CallForApplications,
  CallForApplicationsCreated,
  DeadlineBeforePublication,
} from './call-for-applications';

const general = {
  authorId: 'author',
  createdOn: new DateOnly(2026, 11, 23),
  deadline: null,
  publishedOn: null,
  targetJurisdictionType: 'JUDICIAL_COURT',
  type: 'GENERAL',
} as const;

describe('CallForApplications', () => {
  it('creates the call with its comment without the surrounding spaces', () => {
    const call = CallForApplications.create({ ...general, comment: '  Postes de présidents  ' });

    expect(call.messages).toEqual([
      new CallForApplicationsCreated(
        'author',
        'Postes de présidents',
        general.createdOn,
        null,
        call.id,
        null,
        'JUDICIAL_COURT',
        'GENERAL',
      ),
    ]);
  });

  it('creates the call without a comment left with spaces only', () => {
    const call = CallForApplications.create({ ...general, comment: '   ' });

    expect(call.messages).toMatchObject([{ comment: null }]);
  });

  it('refuses a deadline before the publication', () => {
    expect(() =>
      CallForApplications.create({
        ...general,
        comment: null,
        deadline: new DateOnly(2026, 11, 30),
        publishedOn: new DateOnly(2026, 12, 1),
      }),
    ).toThrow(DeadlineBeforePublication);
  });

  it('accepts a deadline on the day of the publication', () => {
    const call = CallForApplications.create({
      ...general,
      comment: null,
      deadline: new DateOnly(2026, 12, 1),
      publishedOn: new DateOnly(2026, 12, 1),
    });

    expect(call.messages).toHaveLength(1);
  });
});
