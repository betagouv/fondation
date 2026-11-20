import { formationToMemberRole } from '../../shared/formation-to-member-role';
import { isSecretariat, type RoleEnum } from '../../shared/role.enum';

export const MANUAL_WORK_SHARES = [
  'LESS_THAN_10',
  'FROM_10_TO_25',
  'FROM_25_TO_40',
  'FROM_40_TO_60',
  'MORE_THAN_60',
] as const;
export type ManualWorkShare = (typeof MANUAL_WORK_SHARES)[number];

export const DEBATE_CONTRIBUTIONS = ['NEVER', 'FROM_1_TO_5', 'MORE_THAN_5'] as const;
export type DebateContribution = (typeof DEBATE_CONTRIBUTIONS)[number];

export const REVIEW_THOROUGHNESSES = [
  'YES',
  'PARTIALLY',
  'NO_LACK_OF_TIME',
  'NO_LACK_OF_INFORMATION',
] as const;
export type ReviewThoroughness = (typeof REVIEW_THOROUGHNESSES)[number];

export const OTHER_TOOL_USAGES = ['NONE', 'OCCASIONALLY', 'SIGNIFICANTLY'] as const;
export type OtherToolUsage = (typeof OTHER_TOOL_USAGES)[number];

export const QUESTIONNAIRES = ['MEMBER', 'SECRETARIAT'] as const;
export type Questionnaire = (typeof QUESTIONNAIRES)[number];

export type SurveyAnswers = {
  comment: string | null;
  easeRating: number;
  member: {
    debateContribution: DebateContribution;
    manualWorkShare: ManualWorkShare;
    reviewThoroughness: ReviewThoroughness;
  } | null;
  satisfactionRating: number;
  secretariat: {
    manualWorkShare: ManualWorkShare;
    otherToolPurpose: string | null;
    otherToolUsage: OtherToolUsage;
  } | null;
};

export type Respondent = {
  id: string;
  isAdmin: boolean;
  isImpersonated: boolean;
  role: RoleEnum;
};

export type SurveyAccess = {
  mode: 'ANSWER' | 'PREVIEW' | 'TEST';
  questionnaire: Questionnaire;
};

export class SurveyAnswered {
  constructor(
    readonly userId: string,
    readonly answers: SurveyAnswers,
  ) {}
}

export type SurveyEvent = SurveyAnswered;

export const REFUSAL_REASONS = ['IMPERSONATED', 'NOT_CONCERNED', 'WRONG_QUESTIONNAIRE'] as const;
export type RefusalReason = (typeof REFUSAL_REASONS)[number];

export class CannotAnswerSurvey extends Error {
  constructor(readonly reason: RefusalReason) {
    super();
  }
}

export class Survey {
  readonly #messages: SurveyEvent[] = [];

  get messages(): readonly SurveyEvent[] {
    return this.#messages;
  }

  static questionnaireOf(role: RoleEnum): Questionnaire | null {
    if (isSecretariat(role)) return 'SECRETARIAT';
    if (formationToMemberRole().includes(role)) return 'MEMBER';
    return null;
  }

  static accessOf(respondent: Respondent, environment: { isTest: boolean }): SurveyAccess | null {
    // the admins read the answers: theirs would skew the secretariat's, except where nothing is real
    if (respondent.isAdmin)
      return { mode: environment.isTest ? 'TEST' : 'PREVIEW', questionnaire: 'SECRETARIAT' };
    const questionnaire = Survey.questionnaireOf(respondent.role);
    if (!questionnaire) return null;
    // an answer given while impersonating would be the admin's opinion, not the user's
    return {
      mode: respondent.isImpersonated ? 'PREVIEW' : 'ANSWER',
      questionnaire,
    };
  }

  answer(command: {
    answers: SurveyAnswers;
    environment: { isTest: boolean };
    respondent: Respondent;
  }): void {
    const access = Survey.accessOf(command.respondent, command.environment);
    if (!access) throw new CannotAnswerSurvey('NOT_CONCERNED');
    if (access.mode === 'PREVIEW')
      throw new CannotAnswerSurvey(command.respondent.isImpersonated ? 'IMPERSONATED' : 'NOT_CONCERNED');

    const answered = QUESTIONNAIRES.filter((questionnaire) =>
      questionnaire === 'MEMBER' ? command.answers.member : command.answers.secretariat,
    );
    // testing the export needs both questionnaires: an admin outside production picks one
    const isExpected = access.mode === 'TEST' || answered[0] === access.questionnaire;
    if (answered.length !== 1 || !isExpected) throw new CannotAnswerSurvey('WRONG_QUESTIONNAIRE');

    this.#messages.push(new SurveyAnswered(command.respondent.id, command.answers));
  }
}
