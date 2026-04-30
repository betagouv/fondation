import type { APIRequestContext } from '@playwright/test';

export class JurisdictionHttpClient {
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
    await this.http.post('/_/jurisdictions', { data: { items: data } });
  }
}
