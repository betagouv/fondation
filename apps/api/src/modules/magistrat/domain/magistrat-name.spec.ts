import { magistratFullName, magistratTitledFullName, proposedMagistratName } from './magistrat-name';

describe('magistratFullName', () => {
  it.each`
    magistrat                                                                     | expected
    ${{ firstName: 'JEAN-CHARLES', lastName: 'Henri', marriedName: null }}        | ${'HENRI Jean-Charles'}
    ${{ firstName: 'MARIE', lastName: 'SKŁODOWSKA', marriedName: 'Curie' }}       | ${'SKŁODOWSKA Marie (ép. CURIE)'}
    ${{ firstName: 'Marie', lastName: 'DUPONT', marriedName: ' Dupont ' }}        | ${'DUPONT Marie'}
    ${{ firstName: 'Marie', lastName: 'DE  LA ROSE', marriedName: 'de la rose' }} | ${'DE LA ROSE Marie'}
    ${{ firstName: 'Anne', lastName: 'LEFEVRE', marriedName: 'LEFÈVRE' }}         | ${'LEFEVRE Anne (ép. LEFÈVRE)'}
    ${{ firstName: 'Anne', lastName: 'MARTIN', marriedName: '  ' }}               | ${'MARTIN Anne'}
  `('should write $expected', ({ magistrat, expected }) => {
    expect(magistratFullName(magistrat)).toBe(expected);
  });
});

describe('magistratTitledFullName', () => {
  it.each`
    magistrat                                                                                | expected
    ${{ civility: 'M.', firstName: 'JEAN-CHARLES', lastName: 'HENRI', marriedName: null }}   | ${'M.\u00A0HENRI\u00A0Jean-Charles'}
    ${{ civility: 'MME', firstName: 'MARIE', lastName: 'SKŁODOWSKA', marriedName: 'CURIE' }} | ${'Mme\u00A0SKŁODOWSKA\u00A0Marie (ép. CURIE)'}
    ${{ civility: 'Dr', firstName: 'MARIE', lastName: 'SKŁODOWSKA', marriedName: null }}     | ${'SKŁODOWSKA\u00A0Marie'}
  `('should write $expected', ({ magistrat, expected }) => {
    expect(magistratTitledFullName(magistrat)).toBe(expected);
  });
});

describe('proposedMagistratName', () => {
  it('should write the full name of the detected magistrat', () => {
    const nominationFile = {
      detectedMagistrat: { firstName: 'BRIGITTE', lastName: 'ROUSSEL', marriedName: 'HOFFMANN' },
      name: 'ROUSSEL BRIGITTE ep. HOFFMANN',
    };

    expect(proposedMagistratName(nominationFile)).toBe('ROUSSEL Brigitte (ép. HOFFMANN)');
  });

  it('should keep the name sent by LODAM when no magistrat is detected', () => {
    const nominationFile = { detectedMagistrat: null, name: 'ROUSSEL BRIGITTE ep. HOFFMANN' };

    expect(proposedMagistratName(nominationFile)).toBe('ROUSSEL BRIGITTE ep. HOFFMANN');
  });
});
