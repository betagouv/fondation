import { describe, it } from 'node:test';

import { faker } from '@faker-js/faker';

import { generateLolfiFiles } from '../src/generate-lolfi-files';

describe('lolfi', () => {
  it('should create LOLFI files', async (t) => {
    faker.seed(987123123);
    const files = generateLolfiFiles(
      {
        sessions: [
          {
            candidates: [
              {
                firstName: 'ETIENNE',
                lastName: 'TREVOUX',
                position: {
                  function: {
                    formation: 'PARQUET',
                    id: 'PR',
                    label: 'Procureur de la République',
                    labelOneMale: 'procureur de la République',
                  },
                  grade: 'G3',
                  jurisdiction: { id: 'CA  LYON' },
                },
                targetPosition: {
                  function: {
                    formation: 'PARQUET',
                    id: 'PR',
                    label: 'Procureur de la République',
                    labelOneMale: 'procureur de la République',
                  },
                  grade: 'G3',
                  jurisdiction: { id: 'CA  GRENOBLE' },
                  profile: 'profil assise',
                  profileId: null,
                },
              },
            ],
            createdAt: '22/04/2026',
            name: 'Transparence annuelle',
          },
        ],
      },
      faker,
    );

    for await (const file of files) {
      t.assert.snapshot(file);
    }
  });

  it('should write the referential and the magistrate details it is given', async (t) => {
    const prosecutor = {
      formation: 'PARQUET',
      id: 'SUB',
      label: 'Substitut du procureur',
      labelOneFemale: 'substitute du procureur',
      labelOneMale: 'substitut du procureur',
    } as const;
    const files = new Map<string, string>();

    for await (const file of generateLolfiFiles(
      {
        administrativePositions: [{ id: 'EX1', label: 'Exclusion tempo. <à 15 jours', rate: 0 }],
        jurisdictions: [
          { id: 'CA  AIX EN PROVENCE', label: "Cour d'appel d'Aix-en-Provence" },
          { id: 'CA  BASTIA', label: "Cour d'appel de Bastia" },
        ],
        sessions: [
          {
            candidates: [
              {
                birthDate: '14/03/1985',
                careerHistory: 'Auditrice de justice, 01/09/2010. - Substitute du procureur, 01/09/2012.',
                civilite: 'MME',
                firstName: 'AMINATA',
                gradeDate: '01/12/2025',
                installationDate: '02/09/2019',
                lastName: 'DIALLO',
                nominationDate: '15/07/2019',
                phone: '06 39 98 12 34',
                position: {
                  function: prosecutor,
                  grade: 'G2',
                  jurisdiction: {
                    arrondissement: 'TJ  GRASSE',
                    city: 'Cannes',
                    id: 'TPR CANNES',
                    label: 'Tribunal de proximité de Cannes',
                    postalCode: '06400',
                    ressort: 'CA  AIX EN PROVENCE',
                  },
                },
                targetPosition: {
                  function: prosecutor,
                  grade: 'G2',
                  jurisdiction: {
                    id: 'TJ  AJACCIO',
                    label: "Tribunal judiciaire d'Ajaccio",
                    ressort: 'CA  BASTIA',
                  },
                },
              },
            ],
            createdAt: '22/04/2026',
          },
        ],
      },
      faker,
    )) {
      files.set(file.filename, file.buffer);
    }

    t.assert.match(files.get('POSADS.xml')!, /<libelle>Exclusion tempo\. &lt;à 15 jours<\/libelle>/);

    const magistrats = files.get('MAGISTRATS.xml');
    t.assert.match(magistrats!, /<civilite>MME<\/civilite>/);
    t.assert.match(magistrats!, /<date_naiss>14\/03\/1985<\/date_naiss>/);
    t.assert.match(magistrats!, /<date_grade>01\/12\/2025<\/date_grade>/);
    t.assert.match(magistrats!, /<date_nomination>15\/07\/2019<\/date_nomination>/);
    t.assert.match(magistrats!, /<date_installation>02\/09\/2019<\/date_installation>/);
    t.assert.match(magistrats!, /<historique>Auditrice de justice, 01\/09\/2010\. - Substitute/);

    t.assert.match(files.get('CANDIDATS.xml')!, /<tel_perso>06 39 98 12 34<\/tel_perso>/);

    const jurisdictions = files.get('JURIDICTIONS.xml');
    t.assert.match(jurisdictions!, /<codejur>TPR CANNES<\/codejur>[\s\S]*?<ville>Cannes<\/ville>/);
    t.assert.match(
      jurisdictions!,
      /<codejur>CA {2}BASTIA<\/codejur>[\s\S]*?<libelle>Cour d'appel de Bastia<\/libelle>/,
    );
    t.assert.match(
      jurisdictions!,
      /<codejur>TPR CANNES<\/codejur>[\s\S]*?<arrondissement>TJ {2}GRASSE<\/arrondissement>\n<codepos>06400<\/codepos>[\s\S]*?<ressort>CA {2}AIX EN PROVENCE<\/ressort>/,
    );
    t.assert.doesNotMatch(jurisdictions!, /CA {2}(CANNES|AJACCIO)/);
  });

  it('should keep a ressort declared after the jurisdictions it covers', async (t) => {
    let jurisdictions = '';
    for await (const file of generateLolfiFiles(
      {
        jurisdictions: [
          {
            id: 'TPR DZAOUDZI',
            jurisdictionType: 'TPR',
            label: 'Tribunal de proximité de Dzaoudzi',
            ressort: 'TSA MAMOUDZOU',
          },
          {
            id: 'TSA MAMOUDZOU',
            jurisdictionType: 'TSA',
            label: "Tribunal supérieur d'appel de Mamoudzou",
            ressort: 'TSA MAMOUDZOU',
          },
        ],
        sessions: [],
      },
      faker,
    )) {
      if (file.filename === 'JURIDICTIONS.xml') jurisdictions = file.buffer;
    }

    t.assert.match(
      jurisdictions,
      /<codejur>TSA MAMOUDZOU<\/codejur>[\s\S]*?<libelle>Tribunal supérieur d'appel de Mamoudzou</,
    );
    t.assert.doesNotMatch(jurisdictions, /<codejur>CA<\/codejur>/);
  });

  it('should attach a jurisdiction without ressort to the court of appeal of its city', async (t) => {
    let jurisdictions = '';
    for await (const file of generateLolfiFiles(
      { jurisdictions: [{ id: 'TPR CANNES', label: 'Tribunal de proximité de Cannes' }], sessions: [] },
      faker,
    )) {
      if (file.filename === 'JURIDICTIONS.xml') jurisdictions = file.buffer;
    }

    t.assert.match(jurisdictions, /<codejur>TPR CANNES<\/codejur>[\s\S]*?<ressort>CA {2}CANNES<\/ressort>/);
    t.assert.doesNotMatch(jurisdictions, /<codejur>CA<\/codejur>/);
  });
});
