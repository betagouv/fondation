import { Injectable, StreamableFile } from '@nestjs/common';
import { build } from 'node-xlsx';

import type {
  DebateContribution,
  ManualWorkShare,
  OtherToolUsage,
  ReviewThoroughness,
} from '../../domain/session-feedback';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { contentDisposition, FILE_MIME_TYPES } from 'src/modules/framework/files';

const COMMON_COLUMNS = [
  { label: 'Session', width: 40 },
  { label: 'Date de la session', width: 18 },
  { label: 'Rempli le', width: 14 },
  { label: 'Facilité (1 à 5)', width: 16 },
  { label: 'Satisfaction (1 à 10)', width: 20 },
];

const MEMBER_COLUMNS = [
  ...COMMON_COLUMNS,
  { label: 'Temps de manipulation', width: 22 },
  { label: 'Contribution au débat', width: 22 },
  { label: 'Instruction des dossiers', width: 32 },
  { label: 'Ce qui a ralenti ou gêné', width: 60 },
];

const SECRETARIAT_COLUMNS = [
  ...COMMON_COLUMNS,
  { label: 'Temps de ressaisie', width: 22 },
  { label: 'Autre outil que Fondation', width: 30 },
  { label: 'Usage de cet autre outil', width: 60 },
  { label: 'Ce qui a ralenti ou gêné', width: 60 },
];

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

@Injectable()
export class ListSessionFeedbacksAsExcelQuery {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  async handle(): Promise<StreamableFile> {
    const feedbacks = await this.db.tx.sessionFeedback.findMany({
      orderBy: [{ session: { date: 'desc' } }, { sessionId: 'asc' }, { answeredOn: 'asc' }],
      select: {
        answeredOn: true,
        easeRating: true,
        hindrance: true,
        member: { select: { debateContribution: true, manualWorkShare: true, reviewThoroughness: true } },
        satisfactionRating: true,
        secretariat: { select: { manualWorkShare: true, otherToolPurpose: true, otherToolUsage: true } },
        session: { select: { date: true, name: true } },
      } satisfies Prisma.SessionFeedbackSelect,
      where: { session: { deletedAt: null } },
    });

    const commonOf = (feedback: (typeof feedbacks)[number]) => [
      feedback.session.name,
      feedback.session.date.toLocaleDateString('fr-FR', { timeZone: 'UTC' }),
      feedback.answeredOn.toLocaleDateString('fr-FR', { timeZone: 'UTC' }),
      feedback.easeRating,
      feedback.satisfactionRating,
    ];

    const memberRows = feedbacks.flatMap((feedback) =>
      feedback.member
        ? [
            [
              ...commonOf(feedback),
              MANUAL_WORK_SHARE_LABELS[feedback.member.manualWorkShare],
              DEBATE_CONTRIBUTION_LABELS[feedback.member.debateContribution],
              REVIEW_THOROUGHNESS_LABELS[feedback.member.reviewThoroughness],
              feedback.hindrance ?? '',
            ],
          ]
        : [],
    );
    const secretariatRows = feedbacks.flatMap((feedback) =>
      feedback.secretariat
        ? [
            [
              ...commonOf(feedback),
              MANUAL_WORK_SHARE_LABELS[feedback.secretariat.manualWorkShare],
              OTHER_TOOL_USAGE_LABELS[feedback.secretariat.otherToolUsage],
              feedback.secretariat.otherToolPurpose ?? '',
              feedback.hindrance ?? '',
            ],
          ]
        : [],
    );

    const xlsx = build([
      {
        data: [MEMBER_COLUMNS.map(({ label }) => label), ...memberRows],
        name: 'Membres',
        options: { '!cols': MEMBER_COLUMNS.map(({ width }) => ({ wch: width })) },
      },
      {
        data: [SECRETARIAT_COLUMNS.map(({ label }) => label), ...secretariatRows],
        name: 'Secrétariat général',
        options: { '!cols': SECRETARIAT_COLUMNS.map(({ width }) => ({ wch: width })) },
      },
    ]);

    return new StreamableFile(Buffer.from(xlsx), {
      disposition: contentDisposition({
        download: true,
        name: `fondation-avis-utilisateurs-au-${this.clock.now().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }).replaceAll('/', '-')}.xlsx`,
      }),
      type: FILE_MIME_TYPES.xlsx,
    });
  }
}
