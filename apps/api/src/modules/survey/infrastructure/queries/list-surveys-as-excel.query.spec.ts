import { parse } from 'node-xlsx';

import type { Clock } from '../../../framework/clock';
import type { ApiConfig } from '../../../framework/config';
import type { Db } from '../../../framework/database';

import { ListSurveysAsExcelQuery } from './list-surveys-as-excel.query';

const MEMBER = {
  debateContribution: 'NEVER',
  manualWorkShare: 'FROM_25_TO_40',
  reviewThoroughness: 'PARTIALLY',
} as const;

function memberSurvey(props: { answeredAt: string; satisfactionRating: number; userId: string }) {
  return {
    answeredAt: new Date(props.answeredAt),
    comment: null,
    easeRating: 3,
    member: MEMBER,
    satisfactionRating: props.satisfactionRating,
    secretariat: null,
    userId: props.userId,
  };
}

async function exportOf(surveys: ReturnType<typeof memberSurvey>[]) {
  const db = { tx: { survey: { findMany: async () => surveys } } } as unknown as Db;
  const clock = { now: () => new Date('2026-10-07T12:00:00Z') } as Clock;

  const config = { isTestEnvironment: false } as ApiConfig;

  const file = await new ListSurveysAsExcelQuery(clock, config, db).handle();
  const chunks: Buffer[] = [];
  for await (const chunk of file.getStream()) chunks.push(chunk as Buffer);
  return parse(Buffer.concat(chunks));
}

describe('ListSurveysAsExcelQuery', () => {
  it("follows each respondent's answers from one submission to the next", async () => {
    const [members] = await exportOf([
      memberSurvey({ answeredAt: '2026-06-01T10:00:00Z', satisfactionRating: 4, userId: 'alice' }),
      memberSurvey({ answeredAt: '2026-07-01T10:00:00Z', satisfactionRating: 5, userId: 'bob' }),
      memberSurvey({ answeredAt: '2026-10-01T10:00:00Z', satisfactionRating: 7, userId: 'alice' }),
    ]);

    expect(members!.data.map((row) => [row[0], row[1], row[2], row[4], row[9]])).toEqual([
      ['Répondant', 'Envoi n°', 'Rempli le', 'Satisfaction (1 à 10)', 'Réponses modifiées'],
      ['Répondant 1', 1, '01/06/2026', 4, ''],
      ['Répondant 1', 2, '01/10/2026', 7, 'Satisfaction (1 à 10) : 4 → 7 (+3)'],
      ['Répondant 2', 1, '01/07/2026', 5, ''],
    ]);
  });

  it('says so in the tab of a questionnaire nobody answered', async () => {
    const [, secretariat] = await exportOf([
      memberSurvey({ answeredAt: '2026-06-01T10:00:00Z', satisfactionRating: 4, userId: 'alice' }),
    ]);

    expect(secretariat!.data[1]).toEqual(["Aucune réponse pour l'instant"]);
  });
});
