import { excludedJurisdictionConflicts } from './excluded-jurisdiction-conflicts';

describe('excludedJurisdictionConflicts', () => {
  const rennes = { id: 'CA  RENNES', label: 'Cour d’appel de Rennes' };
  const lyon = { id: 'CA  LYON', label: 'Cour d’appel de Lyon' };
  const honorine = { firstName: 'honorine', id: 'honorine', lastName: 'dupont' };
  const gaston = { firstName: 'gaston', id: 'gaston', lastName: 'martin' };

  it('reports each member who excluded the current or the targeted jurisdiction', () => {
    const conflicts = excludedJurisdictionConflicts(
      { current: rennes, targeted: lyon },
      new Map([
        [rennes.id, [honorine]],
        [lyon.id, [gaston]],
      ]),
    );

    expect(conflicts).toEqual([
      { jurisdiction: rennes, member: honorine },
      { jurisdiction: lyon, member: gaston },
    ]);
  });

  it('reports a jurisdiction once when it is both current and targeted', () => {
    const conflicts = excludedJurisdictionConflicts(
      { current: rennes, targeted: rennes },
      new Map([[rennes.id, [honorine]]]),
    );

    expect(conflicts).toEqual([{ jurisdiction: rennes, member: honorine }]);
  });

  it('reports nothing for a file without jurisdictions', () => {
    expect(
      excludedJurisdictionConflicts({ current: null, targeted: null }, new Map([[rennes.id, [honorine]]])),
    ).toEqual([]);
  });
});
