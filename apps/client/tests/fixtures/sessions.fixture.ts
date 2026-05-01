import type { APIRequestContext } from '@playwright/test';

type DateOnly = { day: number; month: number; year: number };
function toDateOnly(date: Date | undefined | null): DateOnly | null {
  if (!date) return null;

  return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

type Payload<T> = {
  [K in keyof T]: T[K] extends undefined ? null : T[K] extends Date ? DateOnly : T[K];
};

function toPayload<const T extends Record<string, string | number | Date | null | undefined>>(
  value: T
): Payload<T> {
  return Object.fromEntries(
    Object.entries(value).map(([key, value]) => {
      if (value === undefined) return [key, null];
      if (value instanceof Date) return [key, toDateOnly(value)];
      return [key, value];
    })
  );
}

export class SessionsHttpClient {
  constructor(private readonly http: APIRequestContext) {}

  /** @see apps/api/src/modules/session/infrastructure/session.test-controller.ts */
  async createSession(data: {
    name: string;
    formation: 'SIEGE' | 'PARQUET';
    date: Date;
    observationClosingDate?: Date | null;
    dueDate?: Date | null;
    positionStartDate?: Date | null;
    lolfiSessionId?: number | null;
  }): Promise<{ id: string }> {
    return this.http
      .post('/_/sessions', {
        data: toPayload({
          observationClosingDate: null,
          dueDate: null,
          positionStartDate: null,
          lolfiSessionId: null,
          typeDeSaisine: 'TRANSPARENCE_GDS',
          ...data
        })
      })
      .then((res) => res.json());
  }

  async attachNominationFiles(body: {
    sessionId: string;
    /** @see apps/api/src/modules/session/infrastructure/session.test-controller.ts */
    files: {
      fileNumber: number;
      name: string;
      rank?: string | null;
      grade: 'G1' | 'G2' | 'G3' | 'G3sup';
      targetedGrade: 'G1' | 'G2' | 'G3' | 'G3sup';
      targetedPosition: string;
      birthDate?: Date | null;
      currentPosition: string;
      lastPositionDate?: Date | null;
      lastRankingDate?: Date | null;
      biography?: string | null;
      careerInformation?: string | null;
      detectedMagistratId?: string | null;
      detectedJurisdictionId?: string | null;
      detectedTargetedFunctionId?: string | null;
      detectedTargetedPositionId?: number | null;
    }[];
  }): Promise<void> {
    const { sessionId, files } = body;
    await this.http.put(`/_/sessions/${sessionId}/files`, {
      data: {
        files: files.map((file) =>
          toPayload({
            rank: null,
            birthDate: null,
            lastPositionDate: null,
            lastRankingDate: null,
            biography: null,
            careerInformation: null,
            detectedMagistratId: null,
            detectedJurisdictionId: null,
            detectedTargetedFunctionId: null,
            detectedTargetedPositionId: null,
            ...file
          })
        )
      }
    });
  }
}
