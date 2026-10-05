import { formationToMemberRole } from 'src/modules/shared/formation-to-member-role';
import type { FormationEnum } from 'src/modules/shared/formation.enum';
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

export type SessionFeedbackAnswers = {
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

export type Respondent = { id: string; isImpersonated: boolean; role: RoleEnum };

export type SessionFeedbackAccess = { mode: 'ANSWER' | 'PREVIEW'; questionnaire: Questionnaire };

export class SessionFeedbackAnswered {
  constructor(
    readonly sessionId: string,
    readonly userId: string,
    readonly answers: SessionFeedbackAnswers,
  ) {}
}

export type SessionFeedbackEvent = SessionFeedbackAnswered;

export const REFUSAL_REASONS = [
  'ALREADY_ANSWERED',
  'IMPERSONATED',
  'NOT_CONCERNED',
  'WRONG_QUESTIONNAIRE',
] as const;
export type RefusalReason = (typeof REFUSAL_REASONS)[number];

export class CannotGiveSessionFeedback extends Error {
  constructor(
    readonly sessionId: string,
    readonly reason: RefusalReason,
  ) {
    super();
  }
}

export class SessionFeedback {
  readonly #messages: SessionFeedbackEvent[] = [];

  private constructor(
    readonly sessionId: string,
    private readonly formation: FormationEnum,
    private readonly hasAnswered: boolean,
  ) {}

  get messages(): readonly SessionFeedbackEvent[] {
    return this.#messages;
  }

  static from(props: { formation: FormationEnum; hasAnswered: boolean; sessionId: string }): SessionFeedback {
    return new SessionFeedback(props.sessionId, props.formation, props.hasAnswered);
  }

  static questionnaireOf(role: RoleEnum, formation: FormationEnum): Questionnaire | null {
    if (role === 'ADJOINT_SECRETAIRE_GENERAL') return 'SECRETARIAT';
    if (formationToMemberRole(formation).includes(role)) return 'MEMBER';
    return null;
  }

  static accessOf(respondent: Respondent, formation: FormationEnum): SessionFeedbackAccess | null {
    // the admins read the answers: theirs would skew the secretariat's
    if (respondent.role === 'ADMIN') return { mode: 'PREVIEW', questionnaire: 'SECRETARIAT' };
    const questionnaire = SessionFeedback.questionnaireOf(respondent.role, formation);
    if (!questionnaire) return null;
    // an answer given while impersonating would be the admin's opinion, not the user's
    return { mode: respondent.isImpersonated ? 'PREVIEW' : 'ANSWER', questionnaire };
  }

  answer(command: { answers: SessionFeedbackAnswers; respondent: Respondent }): void {
    const access = SessionFeedback.accessOf(command.respondent, this.formation);
    if (!access) throw new CannotGiveSessionFeedback(this.sessionId, 'NOT_CONCERNED');
    if (access.mode === 'PREVIEW')
      throw new CannotGiveSessionFeedback(
        this.sessionId,
        command.respondent.isImpersonated ? 'IMPERSONATED' : 'NOT_CONCERNED',
      );
    const { questionnaire } = access;
    if (this.hasAnswered) throw new CannotGiveSessionFeedback(this.sessionId, 'ALREADY_ANSWERED');

    const answered = questionnaire === 'MEMBER' ? command.answers.member : command.answers.secretariat;
    const other = questionnaire === 'MEMBER' ? command.answers.secretariat : command.answers.member;
    if (!answered || other) throw new CannotGiveSessionFeedback(this.sessionId, 'WRONG_QUESTIONNAIRE');

    this.#messages.push(new SessionFeedbackAnswered(this.sessionId, command.respondent.id, command.answers));
  }
}
