import { buildName, buildPosition } from './magistrat.helper';

describe('magistrat helpers', () => {
  describe('buildName', () => {
    it.each`
      magistrat                                                                                          | expected
      ${{ civility: 'M.', firstName: 'JEAN-CHARLES', lastName: 'HENRI', usedName: null }}                | ${'M. Jean-Charles\u00A0HENRI'}
      ${{ civility: 'MME', firstName: 'MARIE', lastName: 'SKŁODOWSKA', usedName: 'SKŁODOWSKA - CURIE' }} | ${'Mme Marie\u00A0SKŁODOWSKA - CURIE'}
    `(`should render as $expected`, ({ magistrat, expected }) => {
      expect(buildName(magistrat)).toBe(expected);
    });
  });

  describe('buildPosition', () => {
    const base = {
      civility: 'M.' as const,
      position: {
        arrondissement: null,
        jurisdiction: { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
        function: {
          id: 'PP',
          label: 'Premier Président',
          labelOneMale: 'premier président',
          labelOneFemale: 'première présidente',
          addition: 'de la {codejur}',
        },
      },
    };

    it('should handle a male position', () => {
      const got = buildPosition(base);
      expect(got).toBe("premier président de la cour d'appel de Lyon");
    });

    it('should handle a female position', () => {
      const got = buildPosition({ ...base, civility: 'MME' });
      expect(got).toBe("première présidente de la cour d'appel de Lyon");
    });

    it('should handle a missing male gendered label', () => {
      const got = buildPosition({
        ...base,
        position: {
          ...base.position,
          function: { ...base.position.function, labelOneMale: null },
        },
      });

      expect(got).toBe("premier président, cour d'appel de Lyon");
    });

    it('should handle a missing female gendered label', () => {
      const got = buildPosition({
        ...base,
        civility: 'MME',
        position: {
          ...base.position,
          function: { ...base.position.function, labelOneFemale: null },
        },
      });

      expect(got).toBe("premier président, cour d'appel de Lyon");
    });

    it('should handle the jurisdiction "SANS AFFECTATION"', () => {
      const got = buildPosition({
        ...base,
        position: {
          function: null,
          arrondissement: null,
          jurisdiction: { id: 'SANS AFFECTATION', label: 'Sans affectation' },
        },
      });

      expect(got).toBe('sans affectation');
    });

    it('should handle the jurisdiction "DETACHEMENT"', () => {
      const got = buildPosition({
        ...base,
        position: {
          function: null,
          arrondissement: null,
          jurisdiction: { id: 'DETACHEMENT', label: 'Personnels détachés' },
        },
      });

      expect(got).toBe('en détachement');
    });

    it('should handle the hidden jurisdiction AC PARIS', () => {
      const got = buildPosition({
        civility: 'MME',
        position: {
          arrondissement: null,
          jurisdiction: { id: 'AC  PARIS', label: 'Administration Centrale' },
          function: {
            addition: null,
            id: 'MACJ',
            label: "Substitut à l'Administration Centrale de la Justice",
            labelOneMale: "substitut à l'administration centrale du ministère de la justice",
            labelOneFemale: "substitute à l'administration centrale du ministère de la justice",
          },
        },
      });

      expect(got).toBe(`substitute à l'administration centrale du ministère de la justice`);
    });

    it.each`
      positionFunction                                                                             | civility | expected
      ${{ id: '1AG', labelOneMale: 'premier avocat général', addition: 'près la {codejur}' }}      | ${'M.'}  | ${'premier avocat général à la cour de cassation'}
      ${{ id: '1AG', labelOneFemale: 'première avocate générale', addition: 'près la {codejur}' }} | ${'MME'} | ${'première avocate générale à la cour de cassation'}
      ${{ id: 'AG', labelOneMale: 'avocat général', addition: 'près la {codejur}' }}               | ${'M.'}  | ${'avocat général à la cour de cassation'}
      ${{ id: 'AG', labelOneFemale: 'avocate générale', addition: 'près la {codejur}' }}           | ${'MME'} | ${'avocate générale à la cour de cassation'}
    `(
      'should handle the "$positionFunction.id" with civility "$civility" in jurisdiction "CC  PARIS"',
      ({ positionFunction, civility, expected }) => {
        const got = buildPosition({
          civility,
          position: {
            arrondissement: null,
            function: positionFunction,
            jurisdiction: { id: 'CC  PARIS', label: 'Cour de Cassation' },
          },
        });

        expect(got).toBe(expected);
      },
    );

    it('should handle the 1AG in any jurisdiction other than "CC  PARIS"', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: null,
          jurisdiction: { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
          function: {
            id: '1AG',
            labelOneMale: 'premier avocat général',
            addition: 'près la {codejur}',
            labelOneFemale: '',
            label: '',
          },
        },
      });

      expect(got).toBe("premier avocat général près la cour d'appel de Lyon");
    });

    it('should handle the hidden jurisdiction AC PARIS', () => {
      const got = buildPosition({
        civility: 'MME',
        position: {
          arrondissement: null,
          jurisdiction: { id: 'AC  PARIS', label: 'Administration Centrale' },
          function: {
            addition: null,
            id: 'MACJ',
            label: "Substitut à l'Administration Centrale de la Justice",
            labelOneMale: "substitut à l'administration centrale du ministère de la justice",
            labelOneFemale: "substitute à l'administration centrale du ministère de la justice",
          },
        },
      });

      expect(got).toBe(`substitute à l'administration centrale du ministère de la justice`);
    });

    it('should build a male JCP position', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: {
            id: 'TJ  CLERMONT FERRAND',
            label: 'Tribunal judiciaire de Clermont-Ferrand',
          },
          jurisdiction: {
            id: 'TPR  RIOM',
            label: 'Tribunal de proximité de Riom',
          },
          function: {
            id: 'JCP',
            addition: 'affecté au {codejur}',
            label: 'Juge des contentieux de la protection',
            labelOneMale: 'juge des contentieux de la protection',
            labelOneFemale: 'juge des contentieux de la protection',
          },
        },
      });

      expect(got).toBe(
        `juge des contentieux de la protection au tribunal judiciaire de Clermont-Ferrand, affecté au tribunal de proximité de Riom`,
      );
    });

    it('should build a female JCP position', () => {
      const got = buildPosition({
        civility: 'MME',
        position: {
          arrondissement: {
            id: 'TJ  CLERMONT FERRAND',
            label: 'Tribunal judiciaire de Clermont-Ferrand',
          },
          jurisdiction: {
            id: 'TPR  RIOM',
            label: 'Tribunal de proximité de Riom',
          },
          function: {
            id: 'JCP',
            addition: 'affecté au {codejur}',
            label: 'Juge des contentieux de la protection',
            labelOneMale: 'juge des contentieux de la protection',
            labelOneFemale: 'juge des contentieux de la protection',
          },
        },
      });

      expect(got).toBe(
        `juge des contentieux de la protection au tribunal judiciaire de Clermont-Ferrand, affectée au tribunal de proximité de Riom`,
      );
    });

    it('should build a female VPCP position', () => {
      const got = buildPosition({
        civility: 'MME',
        position: {
          arrondissement: {
            id: 'TJ  CLERMONT FERRAND',
            label: 'Tribunal judiciaire de Clermont-Ferrand',
          },
          jurisdiction: {
            id: 'TPR  RIOM',
            label: 'Tribunal de proximité de Riom',
          },
          function: {
            id: 'VPCP',
            addition: 'affecté au {codejur}',
            label: 'Vice-Président chargé des fonctions de juge des contentieux de la protection',
            labelOneMale: 'vice-président chargé des fonctions de juge des contentieux de la protection',
            labelOneFemale: 'vice-présidente chargée des fonctions de juge des contentieux de la protection',
          },
        },
      });

      expect(got).toBe(
        `vice-présidente chargée des fonctions de juge des contentieux de la protection au tribunal judiciaire de Clermont-Ferrand, affectée au tribunal de proximité de Riom`,
      );
    });

    it('should build a male VPCP position', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: {
            id: 'TJ  CLERMONT FERRAND',
            label: 'Tribunal judiciaire de Clermont-Ferrand',
          },
          jurisdiction: {
            id: 'TPR  RIOM',
            label: 'Tribunal de proximité de Riom',
          },
          function: {
            id: 'VPCP',
            addition: 'affecté au {codejur}',
            label: 'Vice-Président chargé des fonctions de juge des contentieux de la protection',
            labelOneMale: 'vice-président chargé des fonctions de juge des contentieux de la protection',
            labelOneFemale: 'vice-présidente chargée des fonctions de juge des contentieux de la protection',
          },
        },
      });

      expect(got).toBe(
        `vice-président chargé des fonctions de juge des contentieux de la protection au tribunal judiciaire de Clermont-Ferrand, affecté au tribunal de proximité de Riom`,
      );
    });

    it('should build a JCP position without arrondissement', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: null,
          jurisdiction: {
            id: 'TPR  CLERMONT FERRAND',
            label: 'Tribunal judiciaire de Clermont-Ferrand',
          },
          function: {
            id: 'JCP',
            addition: 'affecté au {codejur}',
            label: 'Juge des contentieux de la protection',
            labelOneMale: 'juge des contentieux de la protection',
            labelOneFemale: 'juge des contentieux de la protection',
          },
        },
      });

      expect(got).toBe(`juge des contentieux de la protection au tribunal judiciaire de Clermont-Ferrand`);
    });
  });
});
