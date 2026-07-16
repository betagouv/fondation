import { stripIndent } from 'common-tags';

import { Gender } from 'shared-models';

import { conjunctionList, date, requiresElision, titled } from '../helpers';
import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import type { Pretty } from 'src/utils/types';

import { commonDocumentCss, documentLayout } from './common.html';

const html = stripIndent;

function agendaHeader(ctx: { sessionMeetingDate: Date; formation: FormationEnum }): string {
  return html`
    <h1>Avis du Conseil supérieur de la magistrature</h1>
    <p class="formation">
      ${ctx.formation === 'SIEGE'
        ? `Formation compétente à l'égard des magistrats du siège`
        : `Formation compétente à l'égard des magistrats du parquet`}
    </p>
    <div class="subtitle-row">
      <p class="subtitle">Ordre du jour</p>
      <p class="date">Séance du ${date(ctx.sessionMeetingDate, 'do MMMM yyyy')}</p>
    </div>
    <p class="introduction">Sur la proposition du garde des Sceaux de nommer&nbsp;:</p>
  `;
}

function agendaNominationParagraph(
  ctx: {
    name: string;
    currentPosition: string | null;
    currentGrade: string;
    targetedPosition: string | null;
    targetedGrade: string;
    reporters: readonly string[];
  },
  index: number,
): string {
  const currentPosition = ctx.currentPosition
    ? `, actuellement ${ctx.currentPosition} (${ctx.currentGrade})`
    : '';
  const targetPosition = ctx.targetedPosition
    ? `, au poste ${requiresElision(ctx.targetedPosition) ? `d'` : 'de '}${ctx.targetedPosition} (${ctx.targetedGrade})`
    : '';
  const reporters = ctx.reporters.length > 0 ? `, au rapport de ${conjunctionList(ctx.reporters)}` : '';

  return html`
    <p class="article" data-file="${index}">
      <strong>${ctx.name}</strong>${currentPosition}${targetPosition}${reporters}.
    </p>
  `;
}

type AgendaContentCtx = Pretty<Parameters<typeof agendaNominationParagraph>[0]>;
function agendaContent(ctx: { nominationFiles: readonly AgendaContentCtx[] }): string {
  return html` ${ctx.nominationFiles.map((n, i) => agendaNominationParagraph(n, i + 1)).join('\n')}`;
}

function agendaFooter(ctx: {
  date: Date;
  chairman: {
    firstName: string;
    lastName: string;
    title: UserTitleEnum | null;
    gender: Gender;
  };
}): string {
  return html`
    <p class="redaction-place">Fait à Paris, le ${date(ctx.date, 'do MMMM yyyy')}</p>
    <p class="signature">${titled(ctx.chairman)}</p>
  `;
}

function agendaCss(): string {
  return /*css */ `
    ${commonDocumentCss()}

    main {
      .content p {
        text-indent: 2rem;
        text-align: justify;
        text-wrap: pretty;
        line-height: 1.5rem;
        break-inside: avoid;

        strong {
          font-weight: 600;
        }
      }

      .header {
        .subtitle-row {
          margin-top: 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        p.introduction {
          text-indent: 0;
          text-align: left;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          font-weight: bold;
        }

        .subtitle {
          font-family: Montserrat, sans-serif;
          margin: 0;
          text-align: left;
          text-transform: uppercase;
          color: var(--gold);
          font-size: 1rem;
          font-weight: 900;
        }

        .date {
          font-size: 0.9rem;
          margin: 0;
          text-align: left;
        }
      }

      .footer {
        break-before: avoid;
        break-inside: avoid;
        margin-top: 3rem;
        font-size: 0.8rem;

        .signature {
          text-align: right;
        }
      }
    }
  `;
}

export const agendaTemplate = documentLayout({
  css: agendaCss,
  header: agendaHeader,
  content: agendaContent,
  footer: agendaFooter,
});
