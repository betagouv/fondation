import { DateOnly } from '../../../utils/date-only';

import {
  CallForApplications,
  CallForApplicationsCreated,
  CallForApplicationsDeleted,
  CallForApplicationsUpdated,
  DeadlineBeforePublication,
  PublishedCallLocked,
} from './call-for-applications';

const metadata = {
  comment: null,
  deadline: null,
  publishedOn: null,
  targetJurisdictionType: 'JUDICIAL_COURT',
  type: 'GENERAL',
} as const;
const AGENT = { id: 'agent', isAdmin: false };
const ADMIN = { id: 'admin', isAdmin: true };

function saved(status: 'PUBLISHED' | 'UNPUBLISHED' = 'UNPUBLISHED') {
  return CallForApplications.from({ ...metadata, id: 'call', status });
}

describe('CallForApplications', () => {
  describe('create', () => {
    it('creates the call with its comment without the surrounding spaces', () => {
      const createdOn = new DateOnly(2026, 11, 23);
      const call = CallForApplications.create({
        ...metadata,
        authorId: 'author',
        comment: '  Postes de présidents  ',
        createdOn,
      });

      expect(call.messages).toEqual([
        new CallForApplicationsCreated('author', createdOn, call.id, {
          ...metadata,
          comment: 'Postes de présidents',
        }),
      ]);
    });

    it('creates the call without a comment left with spaces only', () => {
      const call = CallForApplications.create({
        ...metadata,
        authorId: 'author',
        comment: '   ',
        createdOn: new DateOnly(2026, 11, 23),
      });

      expect(call.messages).toMatchObject([{ metadata: { comment: null } }]);
    });

    it('refuses a deadline before the publication', () => {
      expect(() =>
        CallForApplications.create({
          ...metadata,
          authorId: 'author',
          createdOn: new DateOnly(2026, 11, 23),
          deadline: new DateOnly(2026, 11, 30),
          publishedOn: new DateOnly(2026, 12, 1),
        }),
      ).toThrow(DeadlineBeforePublication);
    });

    it('accepts a deadline on the day of the publication', () => {
      const call = CallForApplications.create({
        ...metadata,
        authorId: 'author',
        createdOn: new DateOnly(2026, 11, 23),
        deadline: new DateOnly(2026, 12, 1),
        publishedOn: new DateOnly(2026, 12, 1),
      });

      expect(call.messages).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('names only the fields that changed, in the order of the form', () => {
      const call = saved();
      const changed = { ...metadata, comment: 'Postes vacants', deadline: new DateOnly(2027, 1, 15) };

      call.update({ ...changed, actor: AGENT });

      expect(call.messages).toEqual([
        new CallForApplicationsUpdated('agent', ['DEADLINE', 'COMMENT'], 'call', changed),
      ]);
    });

    it('leaves no trace when nothing changed', () => {
      const call = saved();

      call.update({ ...metadata, actor: AGENT });

      expect(call.messages).toEqual([]);
    });

    it('refuses a deadline before the publication', () => {
      expect(() =>
        saved().update({
          ...metadata,
          actor: AGENT,
          deadline: new DateOnly(2026, 11, 30),
          publishedOn: new DateOnly(2026, 12, 1),
        }),
      ).toThrow(DeadlineBeforePublication);
    });

    it('refuses an agent once the call is published', () => {
      expect(() => saved('PUBLISHED').update({ ...metadata, actor: AGENT, comment: 'Corrigé' })).toThrow(
        PublishedCallLocked,
      );
    });

    it('lets an administrator change a published call', () => {
      const call = saved('PUBLISHED');

      call.update({ ...metadata, actor: ADMIN, comment: 'Corrigé' });

      expect(call.messages).toMatchObject([{ fields: ['COMMENT'] }]);
    });
  });

  describe('delete', () => {
    it('deletes an unpublished call', () => {
      const call = saved();

      call.delete(AGENT);

      expect(call.messages).toEqual([new CallForApplicationsDeleted('agent', 'call')]);
    });

    it('refuses an agent once the call is published', () => {
      expect(() => saved('PUBLISHED').delete(AGENT)).toThrow(PublishedCallLocked);
    });

    it('lets an administrator delete a published call', () => {
      const call = saved('PUBLISHED');

      call.delete(ADMIN);

      expect(call.messages).toEqual([new CallForApplicationsDeleted('admin', 'call')]);
    });
  });
});
