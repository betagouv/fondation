import { JurisdictionId } from './jurisdiction';
import { ExcludedMemberJurisdictions, Member } from './member';

describe('Member', () => {
  it('should exclude a jurisdiction', () => {
    const member = Member.from({ id: 'member-id' });
    member.excludeJurisdictions(['j-1'] as JurisdictionId[]);

    const [message] = member.messages;
    expect(message).toBeInstanceOf(ExcludedMemberJurisdictions);
    expect(message).toMatchObject({
      userId: 'member-id',
      jurisdictionIds: ['j-1'],
    });
  });

  it('should allow a jurisdiction', () => {
    const member = Member.from({ id: 'member-id' });
    member.excludeJurisdictions([] as JurisdictionId[]);

    const [message] = member.messages;
    expect(message).toBeInstanceOf(ExcludedMemberJurisdictions);
    expect(message).toMatchObject({
      userId: 'member-id',
      jurisdictionIds: [],
    });
  });
});
