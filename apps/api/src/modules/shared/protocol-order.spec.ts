import { byProtocolOrder } from './protocol-order';

describe('byProtocolOrder', () => {
  it('lists the members by rank first', () => {
    const members = [
      { lastName: 'Albert', sort: 2 },
      { lastName: 'Zola', sort: 1 },
    ];

    expect(members.toSorted(byProtocolOrder).map(({ lastName }) => lastName)).toEqual(['Zola', 'Albert']);
  });

  it('then by last name, ignoring the accents', () => {
    const members = [
      { lastName: 'Ellul', sort: 1 },
      { lastName: 'Élie', sort: 1 },
    ];

    expect(members.toSorted(byProtocolOrder).map(({ lastName }) => lastName)).toEqual(['Élie', 'Ellul']);
  });
});
