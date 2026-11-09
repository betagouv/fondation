import { test } from '../fixtures.ts';
import type { AnswerSurveyDto } from '../generated/api/types.ts';

const MEMBER_ANSWERS = {
  comment: 'La recherche des dossiers',
  easeRating: 4,
  member: { debateContribution: 'FROM_1_TO_5', manualWorkShare: 'FROM_10_TO_25', reviewThoroughness: 'YES' },
  satisfactionRating: 8,
  secretariat: null,
} satisfies AnswerSurveyDto;

test.describe('Survey E2E', () => {
  test('a member answers the survey, then answers it again', async ({ member, expect }) => {
    const found = await member.survey.findSurvey();
    expect(found.data?.survey).toEqual({ last: null, questionnaire: 'MEMBER', status: 'NOT_ANSWERED' });

    const answered = await member.survey.answerSurvey({ body: MEMBER_ANSWERS });
    expect(answered.response?.status).toBe(204);

    const answeredAgain = await member.survey.answerSurvey({ body: MEMBER_ANSWERS });
    expect(answeredAgain.response?.status).toBe(204);

    const foundAgain = await member.survey.findSurvey();
    expect(foundAgain.data?.survey).toEqual({
      last: { answeredOn: expect.any(Object) },
      questionnaire: 'MEMBER',
      status: 'ANSWERED',
    });
  });

  test('the secretariat answers its survey', async ({ agent, expect }) => {
    const found = await agent.survey.findSurvey();
    expect(found.data?.survey?.questionnaire).toBe('SECRETARIAT');

    const answered = await agent.survey.answerSurvey({
      body: {
        comment: null,
        easeRating: 3,
        member: null,
        satisfactionRating: 6,
        secretariat: {
          manualWorkShare: 'FROM_25_TO_40',
          otherToolPurpose: 'Le tableur',
          otherToolUsage: 'OCCASIONALLY',
        },
      },
    });
    expect(answered.response?.status).toBe(204);
  });

  test('an admin answers outside production, to test the answers and their export', async ({ admin, expect }) => {
    const found = await admin.survey.findSurvey();
    expect(found.data?.survey).toEqual({ last: null, questionnaire: 'SECRETARIAT', status: 'TEST' });

    const answered = await admin.survey.answerSurvey({ body: MEMBER_ANSWERS });
    expect(answered.response?.status).toBe(204);
  });
});
