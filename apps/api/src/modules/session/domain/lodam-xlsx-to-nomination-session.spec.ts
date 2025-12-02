import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { lodamXlsxToNominationSession } from './lodam-xlsx-to-nomination-session';

describe('lodamXlsxToNominationSession', () => {
  const PATH = path.join(
    __dirname,
    '../../../../test/assets/lodam/lodam_transparence.xlsx',
  );

  it('should result in success', async () => {
    const file = await fs.readFile(PATH);
    const result = await lodamXlsxToNominationSession({ file });

    expect(result.success).toBe(true);
    assert.ok(result.success);

    expect(result.files).toMatchInlineSnapshot(`
     [
       {
         "biography": "- S RODEZ (2ème grade),Dt 08/07/2003. VPR NICE (1er grade),  17/12/2010 (Ins.03/01/2011). - PR MONTLUCON 06/08/2013 (Ins.06/09/2013). - SGSG RIOM 28/10/2016 (Ins.28/10/2016). - PR NARBONNE 14/08/2020 (Ins.01/09/2020).",
         "birthDate": DateOnly {
           "value": 1968-04-09T00:00:00.000Z,
         },
         "currentPosition": "Procureur de la République TJ  NARBONNE",
         "folderNumber": 1,
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
         "targetedPosition": "Procureur de la République TJ  GRASSE - HH",
       },
       {
         "biography": "SM 10 mois. - DESS politiq et gestion de la sécurité. -Chev ONM, 15/11/2018.-  Auditric Just 28 janvier 1999, PF 1er février 1999. - S Chartres, (2ème grade), 31 juillet 2001, (Installat. 31 août 2001). -  MACJ (2ème grade),  à/c 01/09/2004, Dt 13/08/2004. -  VPRP SAINT DENIS DE LA REUNION (1er grade),  27/08/2008 (Ins.01/09/2008).. - PR GAP 21/06/2013 (Ins.02/09/2013). - PR BEZIERS 17/07/2019 (Ins.02/09/2019).",
         "birthDate": DateOnly {
           "value": 1972-05-20T00:00:00.000Z,
         },
         "currentPosition": "Procureur de la République TJ  BEZIERS",
         "folderNumber": 2,
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
         "targetedPosition": "Procureur de la République TJ  TOULON - HH",
       },
     ]
    `);
  });

  it('should return an empty result when provided anything other than XLSX', async () => {
    const result = await lodamXlsxToNominationSession({
      // JPEG image
      file: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    });

    expect(result).toEqual({ success: true, files: [] });
  });
});
