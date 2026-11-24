import { NotFoundException } from '@nestjs/common';

import { makeId } from '../../../utils/id';

import { ExcludedMemberJurisdictions, Member, MemberMagistratsExcluded } from './member';

describe('Member', () => {
  it('should exclude a jurisdiction', () => {
    const member = Member.from({
      id: 'member-id',
      role: 'MEMBRE_COMMUN',
      jurisdictionIds: new Set([makeId('JurisdictionId', 'TGI LYON')]),
    });

    member.excludeJurisdictions(['TGI LYON']);

    const [message] = member.messages;
    expect(message).toBeInstanceOf(ExcludedMemberJurisdictions);
    expect(message).toMatchObject({
      userId: 'member-id',
      jurisdictionIds: ['TGI LYON'],
    });
  });

  it('should allow a jurisdiction', () => {
    const member = Member.from({
      id: 'member-id',
      role: 'MEMBRE_COMMUN',
      jurisdictionIds: new Set(),
    });

    member.excludeJurisdictions([]);

    const [message] = member.messages;
    expect(message).toBeInstanceOf(ExcludedMemberJurisdictions);
    expect(message).toMatchObject({
      userId: 'member-id',
      jurisdictionIds: [],
    });
  });

  it('should throw, if a jurisdiction does not exist', () => {
    const member = Member.from({
      id: 'member-id',
      role: 'MEMBRE_COMMUN',
      jurisdictionIds: new Set(),
    });

    expect(() => member.excludeJurisdictions(['TGI LYON'])).toThrow(NotFoundException);
  });

  describe('excluding magistrats', () => {
    const member = () => Member.from({ id: 'member-id', jurisdictionIds: new Set(), role: 'MEMBRE_COMMUN' });

    it('replaces the excluded magistrats, once each', () => {
      const excluding = member();

      excluding.excludeMagistrats({
        knownMagistratIds: new Set(['magistrat-1']),
        magistratIds: ['magistrat-1', 'magistrat-1'],
      });

      expect(excluding.messages).toEqual([new MemberMagistratsExcluded('member-id', ['magistrat-1'])]);
    });

    it('throws for an unknown magistrat', () => {
      expect(() =>
        member().excludeMagistrats({ knownMagistratIds: new Set(), magistratIds: ['magistrat-1'] }),
      ).toThrow(NotFoundException);
    });
  });
});
