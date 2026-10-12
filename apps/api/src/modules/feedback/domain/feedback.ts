import { formationToMemberRole } from 'src/modules/shared/formation-to-member-role';
import type { RoleEnum } from 'src/modules/shared/role.enum';

export const MANUAL_WORK_SHARES = [
  'LESS_THAN_10',
  'FROM_10_TO_25',
  'FROM_25_TO_40',
  'FROM_40_TO_60',
  'MORE_THAN_60',
] as const;
export type ManualWorkShare = (typeof MANUAL_WORK_SHARES)[number];

export const DEBATE_CONTRIBUTIONS = ['NEVER', 'AT_LEAST_ONCE'] as const;
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

export type FeedbackAnswers = {
  easeRating: number;
  hindrance: string | null;
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
  isImpersonated: boolean;
  role: RoleEnum;
};

export type FeedbackAccess = {
  mode: 'ANSWER' | 'PREVIEW' | 'TEST';
  questionnaire: Questionnaire;
};

export class FeedbackAnswered {
  constructor(
    readonly userId: string,
    readonly answers: FeedbackAnswers,
  ) {}
}

export type FeedbackEvent = FeedbackAnswered;

export const REFUSAL_REASONS = ['IMPERSONATED', 'NOT_CONCERNED', 'WRONG_QUESTIONNAIRE'] as const;
export type RefusalReason = (typeof REFUSAL_REASONS)[number];

export class CannotGiveFeedback extends Error {
  constructor(readonly reason: RefusalReason) {
    super();
  }
}

export class Feedback {
  readonly #messages: FeedbackEvent[] = [];

  get messages(): readonly FeedbackEvent[] {
    return this.#messages;
  }

  static questionnaireOf(role: RoleEnum): Questionnaire | null {
    if (role === 'ADJOINT_SECRETAIRE_GENERAL') return 'SECRETARIAT';
    if (formationToMemberRole().includes(role)) return 'MEMBER';
    return null;
  }

  static accessOf(respondent: Respondent, environment: { isTest: boolean }): FeedbackAccess | null {
    // the admins read the answers: theirs would skew the secretariat's, except where nothing is real
    if (respondent.role === 'ADMIN')
      return { mode: environment.isTest ? 'TEST' : 'PREVIEW', questionnaire: 'SECRETARIAT' };
    const questionnaire = Feedback.questionnaireOf(respondent.role);
    if (!questionnaire) return null;
    // an answer given while impersonating would be the admin's opinion, not the user's
    return {
      mode: respondent.isImpersonated ? 'PREVIEW' : 'ANSWER',
      questionnaire,
    };
  }

  answer(command: {
    answers: FeedbackAnswers;
    environment: { isTest: boolean };
    respondent: Respondent;
  }): void {
    const access = Feedback.accessOf(command.respondent, command.environment);
    if (!access) throw new CannotGiveFeedback('NOT_CONCERNED');
    if (access.mode === 'PREVIEW')
      throw new CannotGiveFeedback(command.respondent.isImpersonated ? 'IMPERSONATED' : 'NOT_CONCERNED');

    const answered = QUESTIONNAIRES.filter((questionnaire) =>
      questionnaire === 'MEMBER' ? command.answers.member : command.answers.secretariat,
    );
    // testing the export needs both questionnaires: an admin outside production picks one
    const isExpected = access.mode === 'TEST' || answered[0] === access.questionnaire;
    if (answered.length !== 1 || !isExpected) throw new CannotGiveFeedback('WRONG_QUESTIONNAIRE');

    this.#messages.push(new FeedbackAnswered(command.respondent.id, command.answers));
  }
}
