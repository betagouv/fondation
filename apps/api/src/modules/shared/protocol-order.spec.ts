import { byProtocolOrder } from './protocol-order';

describe('byProtocolOrder', () => {
  it('lists the members by rank first', () => {
    const members = [
      { firstName: 'Claire', id: '1', lastName: 'Aubert', sort: 2 },
      { firstName: 'Sophie', id: '2', lastName: 'Roussel', sort: 1 },
    ];

    expect(members.toSorted(byProtocolOrder).map(({ lastName }) => lastName)).toEqual(['Roussel', 'Aubert']);
  });

  it('then by last name ignoring the accents', () => {
    const members = [
      { firstName: 'Claire', id: '1', lastName: 'Ellul', sort: 1 },
      { firstName: 'Sophie', id: '2', lastName: 'Élie', sort: 1 },
    ];

    expect(members.toSorted(byProtocolOrder).map(({ lastName }) => lastName)).toEqual(['Élie', 'Ellul']);
  });

  it('then by first name and identifier so that namesakes keep their order', () => {
    const members = [
      { firstName: 'Hélène', id: '3', lastName: 'Martin', sort: 1 },
      { firstName: 'Claire', id: '2', lastName: 'Dubois', sort: 1 },
      { firstName: 'Agnès', id: '4', lastName: 'Martin', sort: 1 },
      { firstName: 'Claire', id: '1', lastName: 'Dubois', sort: 1 },
    ];

    expect(members.toSorted(byProtocolOrder).map(({ firstName, id }) => `${firstName} ${id}`)).toEqual([
      'Claire 1',
      'Claire 2',
      'Agnès 4',
      'Hélène 3',
    ]);
  });
});
