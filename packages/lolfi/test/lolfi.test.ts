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
            name: 'Transparence annuelle',
            createdAt: '22/04/2026',
            candidates: [
              {
                firstName: 'ETIENNE',
                lastName: 'TREVOUX',
                position: {
                  grade: 'G3',
                  jurisdiction: { id: 'CA  LYON' },
                  function: {
                    id: 'PR',
                    label: 'Procureur de la République',
                    labelOneMale: 'procureur de la République',
                    formation: 'PARQUET',
                  },
                },
                targetPosition: {
                  grade: 'G3',
                  jurisdiction: { id: 'CA  GRENOBLE' },
                  function: {
                    id: 'PR',
                    label: 'Procureur de la République',
                    labelOneMale: 'procureur de la République',
                    formation: 'PARQUET',
                  },
                },
              },
            ],
          },
        ],
      },
      faker,
    );

    for await (const file of files) {
      t.assert.snapshot(file);
    }
  });
});
