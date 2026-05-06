import { NotFoundException } from '@nestjs/common';

import { Role } from 'shared-models';

import { makeId } from 'src/utils/id';

import { ExcludedMemberJurisdictions, Member } from './member';

describe('Member', () => {
  it('should exclude a jurisdiction', () => {
    const member = Member.from({
      id: 'member-id',
      role: Role.MEMBRE_COMMUN,
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
      role: Role.MEMBRE_COMMUN,
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
      role: Role.MEMBRE_COMMUN,
      jurisdictionIds: new Set(),
    });

    expect(() => member.excludeJurisdictions(['TGI LYON'])).toThrow(NotFoundException);
  });
});
