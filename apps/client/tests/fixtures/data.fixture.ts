import { faker } from '@faker-js/faker/locale/fr';
import type { APIRequestContext } from '@playwright/test';

export class DataHttpClient {
  constructor(private readonly http: APIRequestContext) {}

  /** @see apps/api/src/modules/members/jurisdictions.test-controller.ts */
  async createJurisdiction(
    data: {
      codejur: string;
      typeJur: string;
      adr1?: string | null;
      adr2?: string | null;
      arrondissement?: string | null;
      codepos?: string | null;
      libelle?: string | null;
      ressort?: string | null;
      villeJur?: string | null;
      ville?: string | null;
    }[]
  ): Promise<void> {
    await this.http.post('/_/data/jurisdictions', { data: { items: data } });
  }

  async createMagistrats(
    data: Partial<{
      externalId: number;
      firstName: string;
      lastName: string;
      usedName: string | null;
      marriedName: string | null;
      civilite: 'M.' | 'MME';
    }>[]
  ): Promise<void> {
    await this.http.post('/_/data/magistrats', {
      data: {
        items: data.map((item) => ({
          civilite: item.civilite ?? faker.helpers.arrayElement(['M.', 'MME']),
          externalId: item.externalId ?? faker.number.int({ min: 1_000, max: 2 ** 48 - 1 }),
          firstName: item.firstName ?? faker.person.firstName(),
          lastName: item.lastName ?? faker.person.lastName(),
          usedName:
            item.usedName !== undefined
              ? item.usedName
              : faker.helpers.maybe(() => faker.person.middleName(), { probability: 0.6 }),
          marriedName:
            item.marriedName !== undefined
              ? item.marriedName
              : faker.helpers.maybe(() => faker.person.lastName(), { probability: 0.4 })
        }))
      }
    });
  }
}
