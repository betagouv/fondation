import { Feedback, FeedbackAnswered, type FeedbackAnswers, type Respondent } from './feedback';

const MEMBER: Respondent = {
  id: 'user-1',
  isImpersonated: false,
  role: 'MEMBRE_DU_SIEGE',
};
const SECRETARIAT: Respondent = {
  id: 'user-2',
  isImpersonated: false,
  role: 'ADJOINT_SECRETAIRE_GENERAL',
};

const ADMIN: Respondent = { ...SECRETARIAT, role: 'ADMIN' };
const PRODUCTION = { isTest: false };
const TEST = { isTest: true };

const COMMON_ANSWERS = {
  easeRating: 4,
  hindrance: null,
  satisfactionRating: 8,
};
const MEMBER_ANSWERS: FeedbackAnswers = {
  ...COMMON_ANSWERS,
  member: {
    debateContribution: 'AT_LEAST_ONCE',
    manualWorkShare: 'FROM_10_TO_25',
    reviewThoroughness: 'YES',
  },
  secretariat: null,
};
const SECRETARIAT_ANSWERS: FeedbackAnswers = {
  ...COMMON_ANSWERS,
  member: null,
  secretariat: {
    manualWorkShare: 'LESS_THAN_10',
    otherToolPurpose: null,
    otherToolUsage: 'NONE',
  },
};

describe('Feedback', () => {
  it.each([
    { questionnaire: 'SECRETARIAT', role: 'ADJOINT_SECRETAIRE_GENERAL' },
    { questionnaire: null, role: 'ADMIN' },
    { questionnaire: 'MEMBER', role: 'MEMBRE_COMMUN' },
    { questionnaire: 'MEMBER', role: 'MEMBRE_DU_PARQUET' },
    { questionnaire: 'MEMBER', role: 'MEMBRE_DU_SIEGE' },
  ] as const)('gives the $role the questionnaire $questionnaire', ({ questionnaire, role }) => {
    expect(Feedback.questionnaireOf(role)).toBe(questionnaire);
  });

  it('records the answers of a member', () => {
    const memberFeedback = new Feedback();

    memberFeedback.answer({ answers: MEMBER_ANSWERS, environment: PRODUCTION, respondent: MEMBER });

    expect(memberFeedback.messages).toEqual([new FeedbackAnswered('user-1', MEMBER_ANSWERS)]);
  });

  it('records the answers of the secretariat', () => {
    const secretariatFeedback = new Feedback();

    secretariatFeedback.answer({
      answers: SECRETARIAT_ANSWERS,
      environment: PRODUCTION,
      respondent: SECRETARIAT,
    });

    expect(secretariatFeedback.messages).toEqual([new FeedbackAnswered('user-2', SECRETARIAT_ANSWERS)]);
  });

  it.each([
    { answers: SECRETARIAT_ANSWERS, case: 'the questionnaire of another role' },
    {
      answers: {
        ...MEMBER_ANSWERS,
        secretariat: SECRETARIAT_ANSWERS.secretariat,
      },
      case: 'both questionnaires',
    },
    {
      answers: { ...MEMBER_ANSWERS, member: null },
      case: 'only the common questions',
    },
  ])('refuses $case', ({ answers }) => {
    expect(() => new Feedback().answer({ answers, environment: PRODUCTION, respondent: MEMBER })).toThrow(
      expect.objectContaining({ reason: 'WRONG_QUESTIONNAIRE' }),
    );
  });

  it.each([
    {
      access: { mode: 'ANSWER', questionnaire: 'MEMBER' },
      case: 'a member of the parquet',
      respondent: { ...MEMBER, role: 'MEMBRE_DU_PARQUET' },
    },
    {
      access: { mode: 'PREVIEW', questionnaire: 'MEMBER' },
      case: 'an admin impersonating a member',
      respondent: { ...MEMBER, isImpersonated: true },
    },
    {
      access: { mode: 'PREVIEW', questionnaire: 'SECRETARIAT' },
      case: 'an admin in production',
      respondent: ADMIN,
    },
  ] as const)('lets $case answer or only go through the questionnaire', ({ access, respondent }) => {
    expect(Feedback.accessOf(respondent, PRODUCTION)).toEqual(access);
  });

  it('lets an admin outside production answer, to test the answers and their export', () => {
    expect(Feedback.accessOf(ADMIN, TEST)).toEqual({ mode: 'TEST', questionnaire: 'SECRETARIAT' });
  });

  it.each([
    { answers: MEMBER_ANSWERS, case: 'the questionnaire of the members' },
    { answers: SECRETARIAT_ANSWERS, case: 'the questionnaire of the secretariat' },
  ])('records an admin outside production answering $case', ({ answers }) => {
    const adminFeedback = new Feedback();

    adminFeedback.answer({ answers, environment: TEST, respondent: ADMIN });

    expect(adminFeedback.messages).toEqual([new FeedbackAnswered('user-2', answers)]);
  });

  it('refuses an admin outside production answering both questionnaires', () => {
    const answers = { ...MEMBER_ANSWERS, secretariat: SECRETARIAT_ANSWERS.secretariat };

    expect(() => new Feedback().answer({ answers, environment: TEST, respondent: ADMIN })).toThrow(
      expect.objectContaining({ reason: 'WRONG_QUESTIONNAIRE' }),
    );
  });

  it.each([
    {
      case: 'the answer of an admin in production',
      reason: 'NOT_CONCERNED',
      respondent: ADMIN,
    },
    {
      case: 'an impersonated user',
      reason: 'IMPERSONATED',
      respondent: { ...SECRETARIAT, isImpersonated: true },
    },
  ] as const)('refuses $case', ({ reason, respondent }) => {
    expect(() =>
      new Feedback().answer({ answers: SECRETARIAT_ANSWERS, environment: PRODUCTION, respondent }),
    ).toThrow(expect.objectContaining({ reason }));
  });
});
