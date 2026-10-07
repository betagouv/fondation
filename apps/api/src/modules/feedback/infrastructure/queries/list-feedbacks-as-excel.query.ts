import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import { build } from 'node-xlsx';

import type {
  DebateContribution,
  FeedbackAnswers,
  ManualWorkShare,
  OtherToolUsage,
  ReviewThoroughness,
} from '../../domain/feedback';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';
import { contentDisposition, FILE_MIME_TYPES } from 'src/modules/framework/files';

type MemberAnswers = FeedbackAnswers & {
  member: NonNullable<FeedbackAnswers['member']>;
};
type SecretariatAnswers = FeedbackAnswers & {
  secretariat: NonNullable<FeedbackAnswers['secretariat']>;
};
type FeedbackRow<T> = { answeredAt: Date; answers: T; respondent: number };
type Question<T> = {
  label: string;
  valueOf: (answers: T) => number | string;
  width: number;
};

const MANUAL_WORK_SHARE_LABELS: Record<ManualWorkShare, string> = {
  FROM_10_TO_25: '10 à 25 %',
  FROM_25_TO_40: '25 à 40 %',
  FROM_40_TO_60: '40 à 60 %',
  LESS_THAN_10: 'Moins de 10 %',
  MORE_THAN_60: 'Plus de 60 %',
};

const DEBATE_CONTRIBUTION_LABELS: Record<DebateContribution, string> = {
  AT_LEAST_ONCE: 'Au moins une fois',
  NEVER: 'Jamais',
};

const REVIEW_THOROUGHNESS_LABELS: Record<ReviewThoroughness, string> = {
  NO_LACK_OF_INFORMATION: "Non, faute d'accès à l'information",
  NO_LACK_OF_TIME: 'Non, faute de temps',
  PARTIALLY: 'Partiellement',
  YES: 'Oui',
};

const OTHER_TOOL_USAGE_LABELS: Record<OtherToolUsage, string> = {
  NONE: "Non, tout s'est fait dans Fondation",
  OCCASIONALLY: 'Oui, ponctuellement',
  SIGNIFICANTLY: 'Oui, pour une partie importante du travail',
};

const RATING_QUESTIONS: Question<FeedbackAnswers>[] = [
  {
    label: 'Facilité (1 à 5)',
    valueOf: (answers) => answers.easeRating,
    width: 16,
  },
  {
    label: 'Satisfaction (1 à 10)',
    valueOf: (answers) => answers.satisfactionRating,
    width: 20,
  },
];

const HINDRANCE_QUESTION: Question<FeedbackAnswers> = {
  label: 'Ce qui a ralenti ou gêné',
  valueOf: (answers) => answers.hindrance ?? '',
  width: 60,
};

const MEMBER_QUESTIONS: Question<MemberAnswers>[] = [
  ...RATING_QUESTIONS,
  {
    label: 'Temps de manipulation',
    valueOf: (answers) => MANUAL_WORK_SHARE_LABELS[answers.member.manualWorkShare],
    width: 22,
  },
  {
    label: 'Contribution au débat',
    valueOf: (answers) => DEBATE_CONTRIBUTION_LABELS[answers.member.debateContribution],
    width: 22,
  },
  {
    label: 'Instruction des dossiers',
    valueOf: (answers) => REVIEW_THOROUGHNESS_LABELS[answers.member.reviewThoroughness],
    width: 32,
  },
  HINDRANCE_QUESTION,
];

const SECRETARIAT_QUESTIONS: Question<SecretariatAnswers>[] = [
  ...RATING_QUESTIONS,
  {
    label: 'Temps de ressaisie',
    valueOf: (answers) => MANUAL_WORK_SHARE_LABELS[answers.secretariat.manualWorkShare],
    width: 22,
  },
  {
    label: 'Autre outil que Fondation',
    valueOf: (answers) => OTHER_TOOL_USAGE_LABELS[answers.secretariat.otherToolUsage],
    width: 30,
  },
  {
    label: 'Usage de cet autre outil',
    valueOf: (answers) => answers.secretariat.otherToolPurpose ?? '',
    width: 60,
  },
  HINDRANCE_QUESTION,
];

function signed(gap: number): string {
  return gap > 0 ? `+${gap}` : String(gap);
}

// rows grouped by respondent, then from the oldest to the newest: each one is compared to the one before
function sheetOf<T>(props: {
  name: string;
  questions: readonly Question<T>[];
  rows: readonly FeedbackRow<T>[];
}) {
  const columns = [
    { label: 'Répondant', width: 14 },
    { label: 'Envoi n°', width: 10 },
    { label: 'Rempli le', width: 14 },
    ...props.questions,
    { label: 'Réponses modifiées', width: 80 },
  ];

  let sendNumber = 0;
  const data = props.rows.map((row, index) => {
    const previous = props.rows[index - 1]?.respondent === row.respondent ? props.rows[index - 1] : undefined;
    sendNumber = previous ? sendNumber + 1 : 1;

    const changes = previous
      ? props.questions.flatMap((question) => {
          const before = question.valueOf(previous.answers);
          const after = question.valueOf(row.answers);
          if (before === after) return [];
          const gap =
            typeof after === 'number' && typeof before === 'number' ? ` (${signed(after - before)})` : '';
          return [`${question.label} : ${before || 'vide'} → ${after || 'vide'}${gap}`];
        })
      : [];

    return [
      `Répondant ${row.respondent}`,
      sendNumber,
      row.answeredAt.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }),
      ...props.questions.map((question) => question.valueOf(row.answers)),
      changes.join(' ; '),
    ];
  });

  return {
    // an empty tab would look like answers went missing, when they are in the other one
    data: [columns.map(({ label }) => label), ...(data.length ? data : [["Aucune réponse pour l'instant"]])],
    name: props.name,
    options: { '!cols': columns.map(({ width }) => ({ wch: width })) },
  };
}

@Injectable()
export class ListFeedbacksAsExcelQuery {
  constructor(
    private readonly clock: Clock,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
    private readonly db: Db,
  ) {}

  async handle(): Promise<StreamableFile> {
    const feedbacks = await this.db.tx.feedback.findMany({
      orderBy: { answeredAt: 'asc' },
      select: {
        answeredAt: true,
        easeRating: true,
        hindrance: true,
        member: { select: { debateContribution: true, manualWorkShare: true, reviewThoroughness: true } },
        satisfactionRating: true,
        secretariat: { select: { manualWorkShare: true, otherToolPurpose: true, otherToolUsage: true } },
        userId: true,
      } satisfies Prisma.FeedbackSelect,
    });

    // pseudonymous: numbered in the order of their first answer, stable as long as no user is deleted (the app never does)
    const respondents = new Map<string, number>();
    for (const { userId } of feedbacks)
      if (!respondents.has(userId)) respondents.set(userId, respondents.size + 1);
    const rows = feedbacks
      .map(({ answeredAt, userId, ...answers }) => ({
        answeredAt,
        answers,
        respondent: respondents.get(userId)!,
      }))
      .toSorted((a, b) => a.respondent - b.respondent);

    const xlsx = build([
      sheetOf({
        name: 'Membres',
        questions: MEMBER_QUESTIONS,
        rows: rows.filter((row): row is FeedbackRow<MemberAnswers> => !!row.answers.member),
      }),
      sheetOf({
        name: 'Secrétariat général',
        questions: SECRETARIAT_QUESTIONS,
        rows: rows.filter((row): row is FeedbackRow<SecretariatAnswers> => !!row.answers.secretariat),
      }),
    ]);

    const day = this.clock
      .now()
      .toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
      .replaceAll('/', '-');
    return new StreamableFile(Buffer.from(xlsx), {
      disposition: contentDisposition({
        download: true,
        name: `fondation-avis-utilisateurs-${this.config.isTestEnvironment ? 'TEST-' : ''}au-${day}.xlsx`,
      }),
      type: FILE_MIME_TYPES.xlsx,
    });
  }
}
