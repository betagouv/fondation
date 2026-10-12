import { test } from '../fixtures.ts';
import type { AnswerFeedbackDto } from '../generated/api/types.ts';

const MEMBER_ANSWERS = {
  easeRating: 4,
  hindrance: 'La recherche des dossiers',
  member: { debateContribution: 'AT_LEAST_ONCE', manualWorkShare: 'FROM_10_TO_25', reviewThoroughness: 'YES' },
  satisfactionRating: 8,
  secretariat: null,
} satisfies AnswerFeedbackDto;

test.describe('Feedback E2E', () => {
  test('a member gives their feedback, then gives it again', async ({ member, expect }) => {
    const found = await member.feedback.findFeedback();
    expect(found.data?.feedback).toEqual({ last: null, questionnaire: 'MEMBER', status: 'NOT_ANSWERED' });

    const answered = await member.feedback.answerFeedback({ body: MEMBER_ANSWERS });
    expect(answered.response?.status).toBe(204);

    const answeredAgain = await member.feedback.answerFeedback({ body: MEMBER_ANSWERS });
    expect(answeredAgain.response?.status).toBe(204);

    const foundAgain = await member.feedback.findFeedback();
    expect(foundAgain.data?.feedback).toEqual({
      last: { answeredOn: expect.any(Object) },
      questionnaire: 'MEMBER',
      status: 'ANSWERED',
    });
  });

  test('the secretariat gives its feedback', async ({ agent, expect }) => {
    const found = await agent.feedback.findFeedback();
    expect(found.data?.feedback?.questionnaire).toBe('SECRETARIAT');

    const answered = await agent.feedback.answerFeedback({
      body: {
        easeRating: 3,
        hindrance: null,
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
    const found = await admin.feedback.findFeedback();
    expect(found.data?.feedback).toEqual({ last: null, questionnaire: 'SECRETARIAT', status: 'TEST' });

    const answered = await admin.feedback.answerFeedback({ body: MEMBER_ANSWERS });
    expect(answered.response?.status).toBe(204);
  });
});
