import { describe, expect, it } from 'vitest';

import { FormationEnum } from 'src/modules/shared/formation.enum';

import { incompleteTransparenceReason } from './incomplete-transparence';

const noSession = new Set<FormationEnum>();
const monday = new Date('2026-09-07T08:00:00Z');
const published = new Date('2026-09-04T00:00:00Z');

describe('incompleteTransparenceReason', () => {
  it('reports a transparence received without a single proposition', () => {
    expect(
      incompleteTransparenceReason(
        {
          designations: { candidatures: 7, perFormation: { SIEGE: 0, PARQUET: 0 } },
          formationsWithSession: noSession,
          publishedAt: published,
        },
        monday,
      ),
    ).toBe('7 candidatures et aucune proposition, aucune session créée');
  });

  it('reports the formation whose propositions produced no session', () => {
    expect(
      incompleteTransparenceReason(
        {
          designations: { candidatures: 114, perFormation: { SIEGE: 20, PARQUET: 3 } },
          formationsWithSession: new Set<FormationEnum>(['SIEGE']),
          publishedAt: published,
        },
        monday,
      ),
    ).toBe('3 propositions au parquet sans session');
  });

  it('reports both formations when the whole transparence lost its files', () => {
    expect(
      incompleteTransparenceReason(
        {
          designations: { candidatures: 40, perFormation: { SIEGE: 1, PARQUET: 4 } },
          formationsWithSession: noSession,
          publishedAt: published,
        },
        monday,
      ),
    ).toBe('1 proposition au siège sans session, 4 propositions au parquet sans session');
  });

  it('stays quiet on a transparence whose positions are simply left unfilled', () => {
    expect(
      incompleteTransparenceReason(
        {
          designations: { candidatures: 3538, perFormation: { SIEGE: 707, PARQUET: 303 } },
          formationsWithSession: new Set<FormationEnum>(['SIEGE', 'PARQUET']),
          publishedAt: published,
        },
        monday,
      ),
    ).toBeNull();
  });

  it('stays quiet on a transparence that only concerns one formation', () => {
    expect(
      incompleteTransparenceReason(
        {
          designations: { candidatures: 98, perFormation: { SIEGE: 0, PARQUET: 18 } },
          formationsWithSession: new Set<FormationEnum>(['PARQUET']),
          publishedAt: published,
        },
        monday,
      ),
    ).toBeNull();
  });

  it('reports a session left without any proposition backing it', () => {
    expect(
      incompleteTransparenceReason(
        {
          designations: { candidatures: 1, perFormation: { SIEGE: 0, PARQUET: 0 } },
          formationsWithSession: new Set<FormationEnum>(['PARQUET']),
          publishedAt: published,
        },
        monday,
      ),
    ).toBe('1 candidature et aucune proposition');
  });

  it('leaves a freshly published transparence the time to receive its candidatures', () => {
    expect(
      incompleteTransparenceReason(
        { designations: undefined, formationsWithSession: noSession, publishedAt: published },
        monday,
      ),
    ).toBeNull();
  });

  it('reports a transparence still waiting for its candidatures a week after its publication', () => {
    expect(
      incompleteTransparenceReason(
        {
          designations: undefined,
          formationsWithSession: noSession,
          publishedAt: new Date('2026-08-25T00:00:00Z'),
        },
        monday,
      ),
    ).toBe('aucune candidature reçue');
  });
});
