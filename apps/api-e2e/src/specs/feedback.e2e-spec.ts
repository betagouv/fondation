import { randomUUID } from 'node:crypto';

import { test } from '../fixtures.ts';
import type { AnswerSessionFeedbackDto } from '../generated/api/types.ts';
import * as seed from '../utils/seed.ts';

const MEMBER_ANSWERS = {
  easeRating: 4,
  hindrance: 'La recherche des dossiers',
  member: { debateContribution: 'AT_LEAST_ONCE', manualWorkShare: 'FROM_10_TO_25', reviewThoroughness: 'YES' },
  satisfactionRating: 8,
  secretariat: null,
} satisfies AnswerSessionFeedbackDto;

test.describe('Feedback E2E', () => {
  let sessionId: string;

  test.beforeEach(async ({ sessions }) => {
    const session = await sessions.createOne({
      candidates: [
        {
          civilite: 'M.',
          firstName: 'ANTONIO',
          lastName: 'GRAMSCI',
          position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  AMIENS'] },
          targetPosition: {
            function: seed.functions.PR,
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  REIMS'],
          },
        },
      ],
      createdAt: '05/10/2026',
      name: randomUUID(),
    });
    sessionId = session.id;
  });

  test('a member gives their feedback on a session', async ({ member, expect }) => {
    const found = await member.feedback.findSessionFeedback({ path: { sessionId } });
    expect(found.data?.feedback).toEqual({
      questionnaire: 'MEMBER',
      session: expect.objectContaining({ id: sessionId }),
      status: 'NOT_ANSWERED',
    });

    const answered = await member.feedback.answerSessionFeedback({ body: MEMBER_ANSWERS, path: { sessionId } });
    expect(answered.response?.status).toBe(204);

    const foundAgain = await member.feedback.findSessionFeedback({ path: { sessionId } });
    expect(foundAgain.data?.feedback?.status).toBe('ANSWERED');
  });

  test('keeps a single answer when a member submits twice at once', async ({ member, expect }) => {
    const answers = await Promise.all(
      [1, 2].map(() => member.feedback.answerSessionFeedback({ body: MEMBER_ANSWERS, path: { sessionId } })),
    );

    expect(answers.map(({ response }) => response?.status)).toEqual(expect.arrayContaining([204, 409]));
  });

  test('the secretariat gives its feedback on a session', async ({ agent, expect }) => {
    const found = await agent.feedback.findSessionFeedback({ path: { sessionId } });
    expect(found.data?.feedback?.questionnaire).toBe('SECRETARIAT');

    const answered = await agent.feedback.answerSessionFeedback({
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
      path: { sessionId },
    });
    expect(answered.response?.status).toBe(204);
  });

  test('an admin goes through the questionnaire without answering it', async ({ admin, expect }) => {
    const found = await admin.feedback.findSessionFeedback({ path: { sessionId } });
    expect(found.data?.feedback).toEqual({
      questionnaire: 'SECRETARIAT',
      session: expect.objectContaining({ id: sessionId }),
      status: 'PREVIEW',
    });
  });
});
