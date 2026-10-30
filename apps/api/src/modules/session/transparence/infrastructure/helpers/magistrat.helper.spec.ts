import { GenderEnum } from '../../../../shared/gender.enum';

import { buildMemberName, buildPosition } from './magistrat.helper';

describe('magistrat helpers', () => {
  describe('buildMemberName', () => {
    it.each`
      magistrat                                                                    | expected
      ${{ firstName: 'JEAN-CHARLES', gender: GenderEnum.MALE, lastName: 'HENRI' }} | ${'M.\u00A0Jean-Charles\u00A0HENRI'}
      ${{ firstName: 'MARIE', gender: GenderEnum.FEMALE, lastName: 'SKŁODOWSKA' }} | ${'Mme\u00A0Marie\u00A0SKŁODOWSKA'}
    `(`should render as $expected`, ({ magistrat, expected }) => {
      expect(buildMemberName(magistrat)).toBe(expected);
    });
  });

  describe('buildPosition', () => {
    const base = {
      civility: 'M.' as const,
      position: {
        arrondissement: null,
        function: {
          addition: 'de la {codejur}',
          id: 'PP',
          label: 'Premier Président',
          labelOneFemale: 'première présidente',
          labelOneMale: 'premier président',
        },
        jurisdiction: { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
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
          arrondissement: null,
          function: null,
          jurisdiction: { id: 'SANS AFFECTATION', label: 'Sans affectation' },
        },
      });

      expect(got).toBe('sans affectation');
    });

    it('should handle the jurisdiction "DETACHEMENT"', () => {
      const got = buildPosition({
        ...base,
        position: {
          arrondissement: null,
          function: null,
          jurisdiction: { id: 'DETACHEMENT', label: 'Personnels détachés' },
        },
      });

      expect(got).toBe('magistrat placé en position de détachement');
    });

    it.each`
      administrativePositionId | expected
      ${'D47-2'}               | ${'magistrat placé en position de disponibilité'}
      ${'CPR'}                 | ${'magistrat placé en position de congé parental'}
      ${'DETJUD'}              | ${'sans affectation'}
      ${'PT'}                  | ${'sans affectation'}
    `(
      'should place a magistrat without affectation in the administrative position "$administrativePositionId"',
      ({ administrativePositionId, expected }) => {
        const got = buildPosition({
          ...base,
          position: {
            administrativePositionId,
            arrondissement: null,
            function: null,
            jurisdiction: { id: 'SANS AFFECTATION', label: 'Sans affectation' },
          },
        });

        expect(got).toBe(expected);
      },
    );

    it('should name an inspector without the inspection', () => {
      const got = buildPosition({
        civility: 'MME',
        position: {
          arrondissement: null,
          function: {
            addition: null,
            id: 'IJ',
            label: 'Inspecteur de la justice',
            labelOneFemale: 'inspectrice de la justice',
            labelOneMale: 'inspecteur de la justice',
          },
          jurisdiction: { id: 'IGSJPARIS', label: 'Inspection Générale des Services Judiciaires' },
        },
      });

      expect(got).toBe('inspectrice de la justice');
    });

    it('should capitalize "Justice" for the head of the inspection', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: null,
          function: {
            addition: null,
            id: 'IG-CIGJ',
            label: "Inspecteur général, chef de l'inspection générale de la justice",
            labelOneFemale: "inspectrice générale, chèfe de l'inspection générale de la justice",
            labelOneMale: "inspecteur général, chef de l'inspection générale de la justice",
          },
          jurisdiction: { id: 'IGSJPARIS', label: 'Inspection Générale des Services Judiciaires' },
        },
      });

      expect(got).toBe("inspecteur général, chef de l'inspection générale de la Justice");
    });

    it('should lowercase a gendered label LOLFI capitalizes', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: null,
          function: {
            addition: null,
            id: 'IGSJ',
            label: 'Inspecteur Général des services judiciaires',
            labelOneFemale: 'Inspectrice générale des services judiciaires',
            labelOneMale: 'Inspecteur général des services judiciaires',
          },
          jurisdiction: { id: 'IGSJPARIS', label: 'Inspection Générale des Services Judiciaires' },
        },
      });

      expect(got).toBe('inspecteur général des services judiciaires');
    });

    it('should place a national prosecutor near the Paris judicial court', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: null,
          function: {
            addition: 'près le {codejur}',
            id: 'PR F',
            label: 'Procureur de la République Financier',
            labelOneFemale: 'procureure de la République financière',
            labelOneMale: 'procureur de la République financier',
          },
          jurisdiction: { id: 'PNF PARIS', label: 'Parquet National Financier de Paris' },
        },
      });

      expect(got).toBe('procureur de la République financier près le tribunal judiciaire de Paris');
    });

    it('should keep the capital of République in a function without a gendered label', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: null,
          function: {
            addition: null,
            id: 'PRACOADJ',
            label: 'Procureur de la République anti-criminalité organisée adjoint',
            labelOneFemale: null,
            labelOneMale: null,
          },
          jurisdiction: { id: 'PNACPARIS', label: 'Parquet National Anti-Criminalité Organisée de Paris' },
        },
      });

      expect(got).toBe(
        'procureur de la République anti-criminalité organisée adjoint près le tribunal judiciaire de Paris',
      );
    });

    it('should name the vice-président of a section as the CSM does', () => {
      const got = buildPosition({
        civility: 'MME',
        position: {
          arrondissement: null,
          function: {
            addition: null,
            id: 'VPSEC',
            label: 'Vice-Président chargé du service de la section',
            labelOneFemale: null,
            labelOneMale: null,
          },
          jurisdiction: { id: 'TJ  AGEN', label: "Tribunal judiciaire d'Agen" },
        },
      });

      expect(got).toBe(
        "vice-présidente chargée de la présidence d'une section détachée au tribunal judiciaire d'Agen",
      );
    });

    it('should drop "des fonctions" from the premier vice-président chargé de l\'application des peines', () => {
      const got = buildPosition({
        civility: 'MME',
        position: {
          arrondissement: null,
          function: {
            addition: 'au {codejur}',
            id: '1VPAP',
            label: "Premier Vice-Président chargé des fonctions de Juge de l' Application des Peines",
            labelOneFemale: "première vice-présidente chargée des fonctions de l'application des peines",
            labelOneMale: "premier vice-président chargé des fonctions de l'application des peines",
          },
          jurisdiction: { id: 'TJ  AGEN', label: "Tribunal judiciaire d'Agen" },
        },
      });

      expect(got).toBe(
        "première vice-présidente chargée de l'application des peines au tribunal judiciaire d'Agen",
      );
    });

    it('should handle the hidden jurisdiction AC PARIS', () => {
      const got = buildPosition({
        civility: 'MME',
        position: {
          arrondissement: null,
          function: {
            addition: null,
            id: 'MACJ',
            label: "Substitut à l'Administration Centrale de la Justice",
            labelOneFemale: "substitute à l'administration centrale du ministère de la justice",
            labelOneMale: "substitut à l'administration centrale du ministère de la justice",
          },
          jurisdiction: { id: 'AC  PARIS', label: 'Administration Centrale' },
        },
      });

      expect(got).toBe(`substitute à l'administration centrale du ministère de la justice`);
    });

    it.each`
      positionFunction                                                                             | civility | expected
      ${{ addition: 'près la {codejur}', id: '1AG', labelOneMale: 'premier avocat général' }}      | ${'M.'}  | ${'premier avocat général à la Cour de cassation'}
      ${{ addition: 'près la {codejur}', id: '1AG', labelOneFemale: 'première avocate générale' }} | ${'MME'} | ${'première avocate générale à la Cour de cassation'}
      ${{ addition: 'près la {codejur}', id: 'AG', labelOneMale: 'avocat général' }}               | ${'M.'}  | ${'avocat général à la Cour de cassation'}
      ${{ addition: 'près la {codejur}', id: 'AG', labelOneFemale: 'avocate générale' }}           | ${'MME'} | ${'avocate générale à la Cour de cassation'}
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
          function: {
            addition: 'près la {codejur}',
            id: '1AG',
            label: '',
            labelOneFemale: '',
            labelOneMale: 'premier avocat général',
          },
          jurisdiction: { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
        },
      });

      expect(got).toBe("premier avocat général près la cour d'appel de Lyon");
    });

    it('should handle the hidden jurisdiction AC PARIS', () => {
      const got = buildPosition({
        civility: 'MME',
        position: {
          arrondissement: null,
          function: {
            addition: null,
            id: 'MACJ',
            label: "Substitut à l'Administration Centrale de la Justice",
            labelOneFemale: "substitute à l'administration centrale du ministère de la justice",
            labelOneMale: "substitut à l'administration centrale du ministère de la justice",
          },
          jurisdiction: { id: 'AC  PARIS', label: 'Administration Centrale' },
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
          function: {
            addition: 'affecté au {codejur}',
            id: 'JCP',
            label: 'Juge des contentieux de la protection',
            labelOneFemale: 'juge des contentieux de la protection',
            labelOneMale: 'juge des contentieux de la protection',
          },
          jurisdiction: {
            id: 'TPR  RIOM',
            label: 'Tribunal de proximité de Riom',
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
          function: {
            addition: 'affecté au {codejur}',
            id: 'JCP',
            label: 'Juge des contentieux de la protection',
            labelOneFemale: 'juge des contentieux de la protection',
            labelOneMale: 'juge des contentieux de la protection',
          },
          jurisdiction: {
            id: 'TPR  RIOM',
            label: 'Tribunal de proximité de Riom',
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
          function: {
            addition: 'affecté au {codejur}',
            id: 'VPCP',
            label: 'Vice-Président chargé des fonctions de juge des contentieux de la protection',
            labelOneFemale: 'vice-présidente chargée des fonctions de juge des contentieux de la protection',
            labelOneMale: 'vice-président chargé des fonctions de juge des contentieux de la protection',
          },
          jurisdiction: {
            id: 'TPR  RIOM',
            label: 'Tribunal de proximité de Riom',
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
          function: {
            addition: 'affecté au {codejur}',
            id: 'VPCP',
            label: 'Vice-Président chargé des fonctions de juge des contentieux de la protection',
            labelOneFemale: 'vice-présidente chargée des fonctions de juge des contentieux de la protection',
            labelOneMale: 'vice-président chargé des fonctions de juge des contentieux de la protection',
          },
          jurisdiction: {
            id: 'TPR  RIOM',
            label: 'Tribunal de proximité de Riom',
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
          function: {
            addition: 'affecté au {codejur}',
            id: 'JCP',
            label: 'Juge des contentieux de la protection',
            labelOneFemale: 'juge des contentieux de la protection',
            labelOneMale: 'juge des contentieux de la protection',
          },
          jurisdiction: {
            id: 'TPR  CLERMONT FERRAND',
            label: 'Tribunal judiciaire de Clermont-Ferrand',
          },
        },
      });

      expect(got).toBe(`juge des contentieux de la protection au tribunal judiciaire de Clermont-Ferrand`);
    });

    it('should keep casing for CC  PARIS with addition', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: null,
          function: {
            addition: 'à la {codejur}',
            id: 'C',
            label: 'Conseiller',
            labelOneFemale: 'conseillère',
            labelOneMale: 'conseiller',
          },
          jurisdiction: { id: 'CC  PARIS', label: 'Cour de Cassation' },
        },
      });

      expect(got).toBe('conseiller à la Cour de Cassation');
    });

    it('should keep casing for CC  PARIS _WITHOUT_ addition', () => {
      const got = buildPosition({
        civility: 'M.',
        position: {
          arrondissement: null,
          function: {
            addition: null,
            id: 'C',
            label: 'Conseiller',
            labelOneFemale: 'conseillère',
            labelOneMale: 'conseiller',
          },
          jurisdiction: { id: 'CC  PARIS', label: 'Cour de Cassation' },
        },
      });

      expect(got).toBe('conseiller, Cour de Cassation');
    });
  });
});
