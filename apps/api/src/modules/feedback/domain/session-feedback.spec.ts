import {
  SessionFeedback,
  SessionFeedbackAnswered,
  type Respondent,
  type SessionFeedbackAnswers,
} from './session-feedback';

const MEMBER: Respondent = { id: 'user-1', isImpersonated: false, role: 'MEMBRE_DU_SIEGE' };
const SECRETARIAT: Respondent = { id: 'user-2', isImpersonated: false, role: 'ADJOINT_SECRETAIRE_GENERAL' };

const COMMON_ANSWERS = { easeRating: 4, hindrance: null, satisfactionRating: 8 };
const MEMBER_ANSWERS: SessionFeedbackAnswers = {
  ...COMMON_ANSWERS,
  member: {
    debateContribution: 'AT_LEAST_ONCE',
    manualWorkShare: 'FROM_10_TO_25',
    reviewThoroughness: 'YES',
  },
  secretariat: null,
};
const SECRETARIAT_ANSWERS: SessionFeedbackAnswers = {
  ...COMMON_ANSWERS,
  member: null,
  secretariat: { manualWorkShare: 'LESS_THAN_10', otherToolPurpose: null, otherToolUsage: 'NONE' },
};

function sessionFeedback(props: Partial<{ hasAnswered: boolean }> = {}) {
  return SessionFeedback.from({
    formation: 'SIEGE',
    hasAnswered: false,
    sessionId: 'session-1',
    ...props,
  });
}

describe('SessionFeedback', () => {
  it.each([
    { questionnaire: 'SECRETARIAT', role: 'ADJOINT_SECRETAIRE_GENERAL' },
    { questionnaire: null, role: 'ADMIN' },
    { questionnaire: 'MEMBER', role: 'MEMBRE_COMMUN' },
    { questionnaire: 'MEMBER', role: 'MEMBRE_DU_SIEGE' },
    { questionnaire: null, role: 'MEMBRE_DU_PARQUET' },
  ] as const)(
    'gives the $role the questionnaire $questionnaire on a session of the siège',
    ({ questionnaire, role }) => {
      expect(SessionFeedback.questionnaireOf(role, 'SIEGE')).toBe(questionnaire);
    },
  );

  it('records the answers of a member', () => {
    const feedback = sessionFeedback();

    feedback.answer({ answers: MEMBER_ANSWERS, respondent: MEMBER });

    expect(feedback.messages).toEqual([new SessionFeedbackAnswered('session-1', 'user-1', MEMBER_ANSWERS)]);
  });

  it('records the answers of the secretariat', () => {
    const feedback = sessionFeedback();

    feedback.answer({ answers: SECRETARIAT_ANSWERS, respondent: SECRETARIAT });

    expect(feedback.messages).toEqual([
      new SessionFeedbackAnswered('session-1', 'user-2', SECRETARIAT_ANSWERS),
    ]);
  });

  it.each([
    { answers: SECRETARIAT_ANSWERS, case: 'the questionnaire of another role' },
    {
      answers: { ...MEMBER_ANSWERS, secretariat: SECRETARIAT_ANSWERS.secretariat },
      case: 'both questionnaires',
    },
    { answers: { ...MEMBER_ANSWERS, member: null }, case: 'only the common questions' },
  ])('refuses $case', ({ answers }) => {
    expect(() => sessionFeedback().answer({ answers, respondent: MEMBER })).toThrow(
      expect.objectContaining({ reason: 'WRONG_QUESTIONNAIRE' }),
    );
  });

  it.each([
    {
      case: 'a member of the other formation',
      reason: 'NOT_CONCERNED',
      respondent: { ...MEMBER, role: 'MEMBRE_DU_PARQUET' },
    },
    { case: 'an impersonated user', reason: 'IMPERSONATED', respondent: { ...MEMBER, isImpersonated: true } },
  ] as const)('refuses $case', ({ reason, respondent }) => {
    expect(() => sessionFeedback().answer({ answers: MEMBER_ANSWERS, respondent })).toThrow(
      expect.objectContaining({ reason }),
    );
  });

  it('refuses a second answer', () => {
    const feedback = sessionFeedback({ hasAnswered: true });

    expect(() => feedback.answer({ answers: MEMBER_ANSWERS, respondent: MEMBER })).toThrow(
      expect.objectContaining({ reason: 'ALREADY_ANSWERED' }),
    );
  });

  it.each([
    { access: { mode: 'ANSWER', questionnaire: 'MEMBER' }, case: 'a member', respondent: MEMBER },
    {
      access: { mode: 'PREVIEW', questionnaire: 'MEMBER' },
      case: 'an admin impersonating a member',
      respondent: { ...MEMBER, isImpersonated: true },
    },
    {
      access: { mode: 'PREVIEW', questionnaire: 'SECRETARIAT' },
      case: 'an admin',
      respondent: { ...SECRETARIAT, role: 'ADMIN' },
    },
    {
      access: null,
      case: 'a member of the other formation',
      respondent: { ...MEMBER, role: 'MEMBRE_DU_PARQUET' },
    },
  ] as const)('lets $case answer or only go through the questionnaire', ({ access, respondent }) => {
    expect(SessionFeedback.accessOf(respondent, 'SIEGE')).toEqual(access);
  });

  it('refuses the answer of an admin', () => {
    expect(() =>
      sessionFeedback().answer({
        answers: SECRETARIAT_ANSWERS,
        respondent: { ...SECRETARIAT, role: 'ADMIN' },
      }),
    ).toThrow(expect.objectContaining({ reason: 'NOT_CONCERNED' }));
  });
});
