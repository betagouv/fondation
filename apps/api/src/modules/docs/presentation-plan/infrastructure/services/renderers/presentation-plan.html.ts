import { load } from 'cheerio';
import { html } from 'common-tags';
import { format } from 'date-fns';

import {
  commonDocumentCss,
  documentLayout,
} from '../../../../shared/infrastructure/services/renderers/common.html';
import {
  date,
  fullname,
  requiresElision,
} from '../../../../shared/infrastructure/services/renderers/helpers';
import {
  DocNominationFileOutcomeEnum,
  docNominationFileOutcomeLabel,
} from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { TimeOnly, timeOnlyToDate } from 'src/utils/time-only';

function css(): string {
  return /* css */ `
    ${commonDocumentCss()}

    h1 {
      margin-bottom: 0;
    }

    h2 {
      color: var(--deep-blue);
      font-size: 1rem;
      margin-top: 0.25rem;
    }

    h3 {
      color: var(--gold);
      break-after: avoid;

      &:first-of-type {
        margin-top: 3rem;
      }
    }

    li {
      font-size: 0.8rem;
    }

    li + li {
      margin-top: 1rem;
    }
  `;
}

function header(ctx: { date: DateOnly; typeDeSaisine: TypeDeSaisineEnum; formation: FormationEnum }): string {
  const saisineTitle = assertIsDefined(
    (
      {
        ['TRANSPARENCE_GDS']: `Proposition du Garde des sceaux`,
      } satisfies Record<TypeDeSaisineEnum, string>
    )[ctx.typeDeSaisine],
    `Le type de saisine n'est pas supporté: "${ctx.typeDeSaisine}"`,
  );

  const formation = ctx.formation === 'PARQUET' ? 'parquet' : 'siège';

  return html`
    <h1>${saisineTitle}</h1>
    <h2>Notice de restitution&nbsp;: séance du ${date(ctx.date)}</h2>
    <p class="formation">Formation compétente à l'égard des magistrats du ${formation}</p>
  `;
}

export type AgendaNominationFile = {
  agendaId: string | null;
  number: number;
  name: string;
  targetedGrade: string;
  targetedPosition: string;
  outcome: DocNominationFileOutcomeEnum;
  outcomeComment: string | null;
};

function displayOutcome(ctx: {
  formation: FormationEnum;
  outcome: Extract<DocNominationFileOutcomeEnum, 'VALIDATED' | 'NON_VALIDATED'>;
}): string {
  return docNominationFileOutcomeLabel(ctx);
}

function nominationFileParagraph(file: AgendaNominationFile): string {
  const position = `${requiresElision(file.targetedPosition) ? `d'` : 'de '}${file.targetedPosition}`;
  return html`
    <li>
      <strong>${file.name}</strong>, pour la proposition au poste ${position}
      (${file.targetedGrade})${file.outcomeComment ? `, aux motifs que&nbsp;: ${file.outcomeComment}` : ''}.
    </li>
  `;
}

function suspendedPagraphs(ctx: { previousCount: number; nominationFiles: readonly AgendaNominationFile[] }) {
  const paragraphs = ctx.nominationFiles
    .filter(({ outcome }) => outcome === 'SUSPENDED')
    .sort((a, b) => a.number - b.number)
    .map(nominationFileParagraph)
    .join('\n');

  if (paragraphs.length === 0) return '';

  const intro =
    ctx.previousCount > 0
      ? html`Par ailleurs, le Conseil sursoit à statuer pour`
      : html`Le Conseil supérieur de la magistrature sursoit à statuer pour`;

  return html`<p>
      ${intro}
      ${paragraphs.length > 1
        ? html`les propositions suivantes&nbsp;:`
        : html`la proposition suivante&nbsp;:`}
    </p>
    ${paragraphs.length === 0 ? '' : `<ul>${paragraphs}</ul>`}`;
}

function nonValidatedParagraph(ctx: {
  formation: FormationEnum;
  nominationFiles: readonly AgendaNominationFile[];
}): string {
  const paragraphs = ctx.nominationFiles
    .filter(({ outcome }) => outcome === 'NON_VALIDATED')
    .sort((a, b) => a.number - b.number)
    .map(nominationFileParagraph)
    .join('\n');

  if (paragraphs.length === 0) return '';

  const intro = html`<p>
    Le Conseil supérieur de la magistrature émet un
    <strong
      >${displayOutcome({
        formation: ctx.formation,
        outcome: 'NON_VALIDATED',
      })}</strong
    >
    ${paragraphs.length > 1
      ? html` aux propositions de nomination suivantes&nbsp;:`
      : html` à la proposition de nomination suivante&nbsp;:`}
  </p>`;

  return html`${intro}${paragraphs.length === 0
    ? ''
    : html`<ul>
        ${paragraphs}
      </ul>`}`;
}

function pluralCount<T>(items: Iterable<T>, predicate: (value: T) => boolean): 0 | 1 | 2 {
  let count: 0 | 1 | 2 = 0;
  for (const item of items) {
    if (predicate(item)) count++;
    if (count === 2) return count;
  }

  return count as 0 | 1 | 2;
}

function chairmanBlock(ctx: {
  formation: FormationEnum;
  chairman: { firstName: string; lastName: string };
  nominationFiles: readonly AgendaNominationFile[];
}): string {
  const nonValidated = nonValidatedParagraph(ctx);

  const nonValidatedCount = pluralCount(ctx.nominationFiles, ({ outcome }) => outcome === 'NON_VALIDATED');
  const suspended = suspendedPagraphs({
    nominationFiles: ctx.nominationFiles,
    previousCount: nonValidatedCount,
  });

  const validatedCount = pluralCount(ctx.nominationFiles, ({ outcome }) => outcome === 'VALIDATED');
  const otherCount = pluralCount(ctx.nominationFiles, ({ outcome }) => outcome !== 'VALIDATED');
  const validatedParagraph =
    validatedCount > 0
      ? html`<p>
          ${nonValidated !== '' && suspended !== ''
            ? `Enfin, le Conseil émet un`
            : nonValidated !== '' || suspended !== ''
              ? `Par ailleurs, le Conseil émet un`
              : `Le Conseil supérieur de la magistrature émet un`}
          <strong>${displayOutcome({ formation: ctx.formation, outcome: 'VALIDATED' })}</strong>
          ${otherCount === 0
            ? validatedCount > 1
              ? html` à toutes les propositions de nomination.`
              : html` à la proposition de nomination.`
            : validatedCount > 1
              ? html` aux autres propositions de nomination.`
              : html` à la proposition de nomination restante.`}
        </p> `
      : html`<p>
          Le Conseil supérieur de la magistrature n'émet un
          ${displayOutcome({ formation: ctx.formation, outcome: 'VALIDATED' })} pour
          <strong>aucune proposition</strong>.
        </p>`;

  return html`
    <p>Sous la présidence de ${fullname(ctx.chairman)}&nbsp;:</p>
    ${nonValidated} ${suspended} ${validatedParagraph}
  `;
}

function presentationPlanSessionSection(ctx: {
  id: string;
  name: string;
  formation: FormationEnum;
  agendas: readonly {
    comments: readonly string[];
    chairman: { firstName: string; lastName: string };
    nominationFiles: readonly AgendaNominationFile[];
  }[];
}): string {
  const allComments = ctx.agendas.flatMap(({ comments }) =>
    comments.flatMap((x) => {
      const trimmed = x.trim();
      return trimmed ? [trimmed] : [];
    }),
  );

  const commentParagraph =
    allComments.length > 1
      ? html`<p>Commentaires&nbsp;:</p>` +
        html`<ul>
          ${allComments.map((comment) => html`<li>${comment}</li>`)}
        </ul>`
      : allComments.length === 1
        ? html`<p>Commentaire&nbsp;: ${allComments[0]!}</p>`
        : '';

  return html`
    <h3>${ctx.name}</h3>
    ${ctx.agendas
      .map(({ chairman, nominationFiles }) =>
        chairmanBlock({ formation: ctx.formation, chairman, nominationFiles }),
      )
      .join('\n')}
    ${commentParagraph}
  `;
}

function endingTime(time: TimeOnly): string {
  return html`Heure de fin de la séance de restitution&nbsp;: ${format(timeOnlyToDate(time), 'HH:mm')}`;
}

function content(ctx: {
  hasRenunciation: boolean;
  time: TimeOnly;
  endingTime?: TimeOnly;
  justiceContactName: string;
  secretary: { firstName: string; lastName: string };
  sessions: readonly {
    id: string;
    name: string;
    typeDeSaisine: TypeDeSaisineEnum;
    formation: FormationEnum;
    agendas: readonly {
      comments: readonly string[];
      chairman: { firstName: string; lastName: string };
      nominationFiles: readonly AgendaNominationFile[];
    }[];
  }[];
}): string {
  return html`
    ${ctx.hasRenunciation
      ? html`<h3>Introduction</h3>
          <p>
            Faire confirmer par la DSJ qu'elle renonce au délai de huit jours prévus à l'article 35 du décret
            du 9 mars 1994 pour la fixation de l'ordre du jour.
          </p>`
      : ''}
    ${ctx.sessions.map((session) => presentationPlanSessionSection(session)).join('\n')}

    <h3>Informations administratives</h3>
    <ul>
      <li>DSJ&nbsp;: ${ctx.justiceContactName}</li>
      <li>SG&nbsp;: ${fullname(ctx.secretary)}</li>
      <li>Heure de début de la séance de restitution&nbsp;: ${format(timeOnlyToDate(ctx.time), 'HH:mm')}</li>
      ${ctx.endingTime ? html`<li>${endingTime(ctx.endingTime)}</li>` : ''}
    </ul>
  `;
}

function footer(): string {
  return html``;
}

export const presentationPlanTemplate = documentLayout({
  css,
  header,
  content,
  footer,
});

export function updatePresentationTimeDocMeetingSessionEndingTime(props: {
  html: string;
  meetingSessionEndingTime: TimeOnly;
}): string {
  const doc = load(props.html);
  doc('.content ul:last-of-type').append(html`<li>${endingTime(props.meetingSessionEndingTime)}</li>`);

  return doc.html();
}
