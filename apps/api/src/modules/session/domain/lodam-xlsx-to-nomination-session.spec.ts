import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { faker } from '@faker-js/faker';
import { Magistrat } from 'shared-models';
import {
  lodamToNominationFiles,
  lodamXlsxToNominationFiles,
  RawLodamLine,
} from './lodam-xlsx-to-nomination-session';

describe('lodamXlsxToNominationSession', () => {
  describe('XLSX Lodam', () => {
    const PATH = path.join(
      __dirname,
      '../../../../test/assets/lodam/lodam_transparence.xlsx',
    );

    it('should parse a LODAM xlsx file correctly', async () => {
      const file = await fs.readFile(PATH);
      const result = await lodamXlsxToNominationFiles({ file });

      expect(result.success).toBe(true);
      assert.ok(result.success);

      expect(result.files).toMatchInlineSnapshot(`
       [
         {
           "biography": "- S RODEZ (2ème grade),Dt 08/07/2003. VPR NICE (1er grade),  17/12/2010 (Ins.03/01/2011). - PR MONTLUCON 06/08/2013 (Ins.06/09/2013). - SGSG RIOM 28/10/2016 (Ins.28/10/2016). - PR NARBONNE 14/08/2020 (Ins.01/09/2020).",
           "birthDate": DateOnly {
             "value": 1968-04-09T00:00:00.000Z,
           },
           "careerInformation": null,
           "currentPosition": "Procureur de la République TJ  NARBONNE",
           "fileNumber": 1,
           "grade": "G1",
           "lastPositionDate": DateOnly {
             "value": 2020-09-01T00:00:00.000Z,
           },
           "lastRankingDate": DateOnly {
             "value": 2010-12-17T00:00:00.000Z,
           },
           "name": "ROSELIN PIORIER",
           "observers": [],
           "rank": "(10 sur une liste de 12)",
           "reporters": [
             "DURAND Côme",
           ],
           "targetedGrade": "HH",
           "targetedPosition": "Procureur de la République TJ  GRASSE",
         },
         {
           "biography": "SM 10 mois. - DESS politiq et gestion de la sécurité. -Chev ONM, 15/11/2018.-  Auditric Just 28 janvier 1999, PF 1er février 1999. - S Chartres, (2ème grade), 31 juillet 2001, (Installat. 31 août 2001). -  MACJ (2ème grade),  à/c 01/09/2004, Dt 13/08/2004. -  VPRP SAINT DENIS DE LA REUNION (1er grade),  27/08/2008 (Ins.01/09/2008).. - PR GAP 21/06/2013 (Ins.02/09/2013). - PR BEZIERS 17/07/2019 (Ins.02/09/2019).",
           "birthDate": DateOnly {
             "value": 1972-05-20T00:00:00.000Z,
           },
           "careerInformation": null,
           "currentPosition": "Procureur de la République TJ  BEZIERS",
           "fileNumber": 2,
           "grade": "G1",
           "lastPositionDate": DateOnly {
             "value": 2019-09-02T00:00:00.000Z,
           },
           "lastRankingDate": DateOnly {
             "value": 2008-08-27T00:00:00.000Z,
           },
           "name": "AZELINE NOEL",
           "observers": [
             "LAZARE JACQUET",
           ],
           "rank": "(7 sur une liste de 14)",
           "reporters": [
             "ANDOCHE Charles",
             "DURAND Côme",
           ],
           "targetedGrade": "HH",
           "targetedPosition": "Procureur de la République TJ  TOULON",
         },
       ]
      `);
    });

    it('should return an empty result when provided anything other than XLSX', async () => {
      const result = await lodamXlsxToNominationFiles({
        // JPEG image
        file: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      });

      expect(result).toEqual({ success: true, files: [] });
    });
  });

  describe('LODAM structure', () => {
    let index = 1;
    const lodamLine = (props: Partial<RawLodamLine>): RawLodamLine => ({
      biography: undefined,
      birthDate: undefined,
      careerInformation: undefined,
      currentPosition: undefined,
      fileNumber: (index++).toString(10),
      lastPositionDate: undefined,
      lastRankingDate: undefined,
      name: faker.person.fullName().toUpperCase() + '\n(1 sur une liste 12)',
      observers: undefined,
      reporters: undefined,
      targetedPosition: 'TJ RENNES - II',
      _eqav: 'E',
      ...props,
    });

    beforeEach(() => {
      index = 1;
    });

    it('should fail when the file number is not a number', async () => {
      const result = await lodamToNominationFiles(
        [lodamLine({ fileNumber: 'not a number' })],
        new Date('2025-12-05T00:00:00Z'),
      );

      expect(result).toEqual({
        success: false,
        errors: [
          {
            lineNumber: 1,
            messages: [
              'Le numéro de proposition est inexploitable: "not a number"',
            ],
          },
        ],
      });
    });

    it('should fail when a fileNumber appears more than once', async () => {
      const result = await lodamToNominationFiles(
        [
          lodamLine({ fileNumber: '1', name: 'ARENDT HANNAH' }),
          lodamLine({ fileNumber: '2', name: 'GRAMSCI ANTONIO' }),
          lodamLine({ fileNumber: '1', name: 'BOURDIEU PIERRE' }),
        ],
        new Date('2025-12-05T00:00:00Z'),
      );

      expect(result).toEqual({
        success: false,
        errors: expect.arrayContaining([
          {
            fileNumber: 1,
            messages: expect.arrayContaining([
              'l.3 un dossier n°1 est déjà défini l.1',
            ]),
          },
        ]),
      });
    });

    it('should fail when the name is empty', async () => {
      const result = await lodamToNominationFiles(
        [lodamLine({ name: '' })],
        new Date('2025-12-05T00:00:00Z'),
      );

      expect(result).toEqual({
        success: false,
        errors: [
          {
            fileNumber: 1,
            messages: expect.arrayContaining(['Magistrat est vide']),
          },
        ],
      });
    });

    it('should fail when the targeted position is empty', async () => {
      const result = await lodamToNominationFiles(
        [lodamLine({ targetedPosition: '' })],
        new Date('2025-12-05T00:00:00Z'),
      );

      expect(result).toEqual({
        success: false,
        errors: [
          {
            fileNumber: 1,
            messages: expect.arrayContaining(['Le poste cible est vide']),
          },
        ],
      });
    });

    it('should allow en empty reporters placeholder', async () => {
      const result = await lodamToNominationFiles(
        [
          lodamLine({
            reporters: 'SANS AFFECTATION',
            targetedPosition: 'TJ RENNES - II',
          }),
        ],
        new Date('2025-12-05T00:00:00Z'),
      );

      expect(result).toMatchObject({ success: true });
    });

    it('should parse a list of observers', async () => {
      const result = await lodamToNominationFiles(
        [
          lodamLine({
            observers: 'BOURDIEU Pierre  \n  GRAMSCI Antonio  ',
          }),
        ],
        new Date('2025-12-05T00:00:00Z'),
      );

      assert.ok(result.success);
      expect(result.files[0]?.observers).toEqual([
        'BOURDIEU Pierre',
        'GRAMSCI Antonio',
      ]);
    });

    it('should parse a list of reporters', async () => {
      const result = await lodamToNominationFiles(
        [
          lodamLine({
            reporters: 'BOURDIEU Pierre  \n  GRAMSCI Antonio  ',
          }),
        ],
        new Date('2025-12-05T00:00:00Z'),
      );

      assert.ok(result.success);
      expect(result.files[0]?.reporters).toEqual([
        'BOURDIEU Pierre',
        'GRAMSCI Antonio',
      ]);
    });

    it('should parse the birth date from dd/mm/yyyy', async () => {
      const result = await lodamToNominationFiles(
        [lodamLine({ birthDate: '01/08/1930' })],
        new Date('2025-12-05T00:00:00Z'),
      );

      assert.ok(result.success);
      expect(result.files[0]?.birthDate?.toDate()).toEqual(
        new Date('1930-08-01T00:00:00Z'),
      );
    });

    it("should fail when the date can't be parsed", async () => {
      const result = await lodamToNominationFiles(
        [lodamLine({ birthDate: 'unknown' })],
        new Date('2025-12-05T00:00:00Z'),
      );

      expect(result).toEqual({
        success: false,
        errors: [
          {
            fileNumber: 1,
            messages: ['La date de naissance est inexploitable: "unknown"'],
          },
        ],
      });
    });

    it('should parse the last position date from dd/mm/yyyy', async () => {
      const result = await lodamToNominationFiles(
        [lodamLine({ lastPositionDate: '01/01/2020' })],
        new Date('2025-12-05T00:00:00Z'),
      );

      assert.ok(result.success);
      expect(result.files[0]?.lastPositionDate?.toDate()).toEqual(
        new Date('2020-01-01T00:00:00Z'),
      );
    });

    it('should parse the last ranking date from dd/mm/yyyy', async () => {
      const result = await lodamToNominationFiles(
        [lodamLine({ lastRankingDate: '01/01/2019' })],
        new Date('2025-12-05T00:00:00Z'),
      );

      assert.ok(result.success);
      expect(result.files[0]?.lastRankingDate?.toDate()).toEqual(
        new Date('2019-01-01T00:00:00Z'),
      );
    });

    it('should parse the grade from the name', async () => {
      const result = await lodamToNominationFiles(
        [lodamLine({ targetedPosition: 'TJ RENNES - HH' })],
        new Date('2025-12-05T00:00:00Z'),
      );

      assert.ok(result.success);
      expect(result.files[0]?.grade).toEqual(Magistrat.Grade.HH);
    });

    it('should parse the targeted position and the grade when the title contains a dash', async () => {
      const result = await lodamToNominationFiles(
        [
          lodamLine({
            targetedPosition:
              'Vice-président chargé des fonctions de juge des libertés et de la détention TJ  AUCH - I',
          }),
        ],
        new Date('2025-12-05T00:00:00Z'),
      );

      assert.ok(result.success);
      expect(result.files[0]?.grade).toEqual(Magistrat.Grade.I);
      expect(result.files[0]?.targetedPosition).toEqual(
        'Vice-président chargé des fonctions de juge des libertés et de la détention TJ  AUCH',
      );
    });

    it('should parse the current and target according to advancement column', async () => {
      const result = await lodamToNominationFiles(
        [
          lodamLine({
            _eqav: 'A',
            targetedPosition: 'TJ DE RENNES - G3',
          }),
        ],
        new Date('2025-12-05T00:00:00Z'),
      );

      assert.ok(result.success);
      expect(result.files[0]?.grade).toEqual(Magistrat.Grade.G2);
      expect(result.files[0]?.targetedGrade).toEqual(Magistrat.Grade.G3);
    });

    it('should parse the current and target according to advancement column and the old system', async () => {
      const result = await lodamToNominationFiles(
        [
          lodamLine({
            _eqav: 'A',
            targetedPosition: 'TJ DE RENNES - HH',
          }),
        ],
        new Date(Date.UTC(2025, 10, 23)),
      );

      assert.ok(result.success);
      expect(result.files[0]?.grade).toEqual(Magistrat.Grade.I);
      expect(result.files[0]?.targetedGrade).toEqual(Magistrat.Grade.HH);
    });

    it('should fail when the grade is unknown', async () => {
      const result = await lodamToNominationFiles(
        [lodamLine({ targetedPosition: 'TJ RENNES - ZZ' })],
        new Date('2025-12-05T00:00:00Z'),
      );

      expect(result).toEqual({
        success: false,
        errors: [{ fileNumber: 1, messages: ['Grade inconnu: "ZZ"'] }],
      });
    });
  });
});
