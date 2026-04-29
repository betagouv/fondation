import type { HttpClient } from './http-client.fixture';

type DateOnly = { date: number; month: number; year: number };

export class SessionsHttpClient {
  constructor(private readonly http: HttpClient) {}

  /** @see apps/api/src/modules/session/infrastructure/session.test-controller.ts */
  createSession(data: {
    name: string;
    formation: 'SIEGE' | 'PARQUET';
    date: DateOnly;
    observationClosingDate: DateOnly | null;
    dueDate: DateOnly | null;
    positionStartDate: DateOnly | null;
    lolfiSessionId: number | null;
  }): Promise<{ id: string }> {
    return this.http.request({ data, url: '/_/sessions', method: 'POST' }).then((res) => res.json());
  }

  async attachNominationFiles(body: {
    sessionId: string;
    /** @see apps/api/src/modules/session/infrastructure/session.test-controller.ts */
    files: {
      fileNumber: number;
      name: string;
      rank: string | null;
      grade: 'G1' | 'G2' | 'G3' | 'G3sup';
      targetedGrade: 'G1' | 'G2' | 'G3' | 'G3sup';
      targetedPosition: string;
      birthDate: DateOnly | null;
      currentPosition: string;
      lastPositionDate: DateOnly | null;
      lastRankingDate: DateOnly | null;
      biography: string | null;
      careerInformation: string | null;
      detectedMagistratId: string | null;
      detectedJurisdictionId: string | null;
      detectedTargetedFunctionId: string | null;
      detectedTargetedPositionId: number | null;
    }[];
  }): Promise<void> {
    const { sessionId, ...data } = body;
    await this.http.request({
      data,
      method: 'PUT',
      url: `/_/sessions/${sessionId}/files`
    });
  }
}
