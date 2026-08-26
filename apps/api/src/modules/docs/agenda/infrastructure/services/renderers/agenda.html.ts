import { oneLine } from 'common-tags';

import {
  commonDocumentCss,
  documentLayout,
} from '../../../../shared/infrastructure/services/renderers/common.html';
import {
  conjunctionList,
  date,
  requiresElision,
  titled,
} from '../../../../shared/infrastructure/services/renderers/helpers';
import { Template } from '../../../../shared/infrastructure/services/renderers/templates.types';
import { AgendaBlockFile } from '../../../domain/agenda-doc-block';
import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';

const html = oneLine;

type AgendaRenderContextNominationFile = {
  id: bigint;
  number: number;
  name: string;
  currentPosition: string | null;
  currentGrade: string;
  targetedPosition: string | null;
  targetedGrade: string;
  reporters: readonly string[];
};

export type AgendaRenderContext = {
  date: DateOnly;
  sessionMeetingDate: DateOnly;
  formation: FormationEnum;
  chairman: {
    firstName: string;
    lastName: string;
    title: UserTitleEnum | null;
    gender: GenderEnum;
  };
  nominationFiles: readonly AgendaRenderContextNominationFile[];
  userDefinedBlocks: {
    files: Map<bigint, { html: string; isOutdated: boolean }>;
  };
};

function agendaHeader(ctx: AgendaRenderContext): string {
  return html`
    <h1>Avis du Conseil supérieur de la magistrature</h1>
    <p class="formation">
      ${
        ctx.formation === 'SIEGE'
          ? `Formation compétente à l'égard des magistrats du siège`
          : `Formation compétente à l'égard des magistrats du parquet`
      }
    </p>
    <div class="subtitle-row">
      <p class="subtitle">Ordre du jour</p>
      <p class="date">Séance du ${date(ctx.sessionMeetingDate, 'do MMMM yyyy')}</p>
    </div>
    <p class="introduction">Sur la proposition du garde des Sceaux de nommer&nbsp;:</p>
  `;
}

function displayFileContent(ctx: {
  root: AgendaRenderContext;
  file: AgendaRenderContextNominationFile;
  ignoreUserDefinedContent?: true;
}): string {
  const userDefinedContent = ctx.root.userDefinedBlocks.files.get(ctx.file.id)?.html;
  if (!ctx.ignoreUserDefinedContent && userDefinedContent) return userDefinedContent;

  const currentPosition = ctx.file.currentPosition
    ? `, actuellement ${ctx.file.currentPosition} (${ctx.file.currentGrade})`
    : '';
  const targetPosition = ctx.file.targetedPosition
    ? `, au poste ${requiresElision(ctx.file.targetedPosition) ? `d'` : 'de '}${ctx.file.targetedPosition} (${ctx.file.targetedGrade})`
    : '';
  const reporters =
    ctx.file.reporters.length > 0 ? `, au rapport de ${conjunctionList(ctx.file.reporters)}` : '';

  return /* html */ `<strong>${ctx.file.name}</strong>${currentPosition}${targetPosition}${reporters}.`;
}

function agendaNominationParagraph(ctx: {
  root: AgendaRenderContext;
  file: AgendaRenderContextNominationFile;
  index: number;
}): string {
  return html`<p data-file="${ctx.index}">${displayFileContent({ root: ctx.root, file: ctx.file })}</p>`;
}

function agendaContent(ctx: AgendaRenderContext): string {
  return html` ${ctx.nominationFiles
    .map((file, index) => agendaNominationParagraph({ root: ctx, file, index: index + 1 }))
    .join('\n')}`;
}

function agendaFooter(ctx: AgendaRenderContext): string {
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
          margin-top: 5rem;
          text-align: right;
        }
      }
    }
  `;
}

export const agendaTemplate: Template<AgendaRenderContext> = documentLayout({
  css: agendaCss,
  header: agendaHeader,
  content: agendaContent,
  footer: agendaFooter,
} as any) as any;

export function* agendaBlocks(ctx: AgendaRenderContext): Iterable<AgendaBlockFile> {
  for (const file of ctx.nominationFiles) {
    const userDefined = ctx.userDefinedBlocks.files.get(file.id);
    const outdated = Boolean(userDefined?.isOutdated);

    yield {
      kind: 'file',
      weight: file.number,
      id: file.id,
      html: displayFileContent({ root: ctx, file }),
      edited: Boolean(userDefined?.html),
      outdated,
      generatedHtml: outdated
        ? displayFileContent({ root: ctx, file, ignoreUserDefinedContent: true })
        : undefined,
    };
  }
}
