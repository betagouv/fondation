import { html } from 'common-tags';
import { format } from 'date-fns';
import { Magistrat, TypeDeSaisine } from 'shared-models';
import { DocNominationFileOutcomeEnum } from 'src/modules/docs/domain/doc-nomination-file-outcome';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { TimeOnly, timeOnlyToDate } from 'src/utils/time-only';
import { date, fullname } from '../helpers';
import { commonDocumentCss, documentLayout } from './common.html';

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
      counter-increment: sections;
      break-after: avoid;

      &:first-of-type {
        margin-top: 3rem;
      }
    }

    h3::before {
      content: counter(sections) ". ";
    }

    li {
      font-size: 0.8rem;
    }
  `;
}

function header(ctx: {
  date: DateOnly;
  typeDeSaisine: TypeDeSaisine;
  formation: Magistrat.Formation;
}): string {
  const saisineTitle = assertIsDefined(
    (
      {
        [TypeDeSaisine.TRANSPARENCE_GDS]: `Proposition du Garde des sceaux`,
      } satisfies Record<TypeDeSaisine, string>
    )[ctx.typeDeSaisine],
    `Le type de saisine n'est pas supporté: "${ctx.typeDeSaisine}"`,
  );

  const formation =
    ctx.formation === Magistrat.Formation.PARQUET ? 'parquet' : 'siège';

  return html`
    <h1>${saisineTitle}</h1>
    <h2>Notice de restitution&nbsp;: séance du ${date(ctx.date)}</h2>
    <p class="formation">
      Formation compétente à l'égard des magistrats du ${formation}
    </p>
  `;
}

export type AgendaNominationFile = {
  number: number;
  name: string;
  targetedGrade: string;
  targetedPosition: string;
  outcome: DocNominationFileOutcomeEnum;
  outcomeComment: string | null;
};

function displayOutcome(ctx: {
  formation: Magistrat.Formation;
  outcome: Extract<DocNominationFileOutcomeEnum, 'VALIDATED' | 'NON_VALIDATED'>;
}): string {
  switch (ctx.outcome) {
    case 'NON_VALIDATED':
      switch (ctx.formation) {
        case Magistrat.Formation.PARQUET:
          return 'avis défavorable';
        default:
          return 'avis non conforme';
      }

    case 'VALIDATED':
      switch (ctx.formation) {
        case Magistrat.Formation.PARQUET:
          return 'avis favorable';
        default:
          return 'avis conforme';
      }
  }
}

function nonValidatedParagraph(ctx: {
  formation: Magistrat.Formation;
  nominationFiles: AgendaNominationFile[];
}): string {
  const paragraphs = ctx.nominationFiles
    .filter(({ outcome }) => outcome === 'NON_VALIDATED')
    .sort((a, b) => a.number - b.number)
    .map(
      (file) => html`
        <p>
          <strong>${file.name}</strong>, pour la proposition au poste de
          ${file.targetedPosition}
          (${file.targetedGrade})${file.outcomeComment
            ? `, aux motifs que&nbsp;:${file.outcomeComment}`
            : ''}.
        </p>
      `,
    )
    .join('\n');

  const intro = html`<p>
    Le conseil supérieur de la magistrature émet un
    <strong
      >${displayOutcome({
        formation: ctx.formation,
        outcome: 'NON_VALIDATED',
      })}</strong
    >
    ${paragraphs.length > 1
      ? ` aux propositions de nominations suivantes&nbsp;:`
      : ` à la proposition de nomination suivante&nbsp;:`}
  </p>`;

  if (paragraphs.length === 0) return '';

  return html`${intro}${paragraphs}`;
}

function presentationPlanSessionSection(ctx: {
  formation: Magistrat.Formation;
  sessionName: string;
  comment: string | null;
  chairman: { firstName: string; lastName: string };
  nominationFiles: AgendaNominationFile[];
}) {
  const nonValidated = nonValidatedParagraph(ctx);

  const nonValidatedCount = ctx.nominationFiles.filter(
    (file) => file.outcome === 'NON_VALIDATED',
  ).length;
  const validatedCount = ctx.nominationFiles.filter(
    (file) => file.outcome === 'VALIDATED',
  ).length;

  const validatedParagraph =
    validatedCount > 0
      ? html`<p>
          Le Conseil supérieur de la magistrature émet un
          <strong
            >${displayOutcome({
              formation: ctx.formation,
              outcome: 'VALIDATED',
            })}</strong
          >
          ${nonValidatedCount === 0
            ? validatedCount > 1
              ? html` à toutes les propositions de nominations.`
              : html` à la proposition de nomination.`
            : validatedCount > 1
              ? html` aux autres propositions de nominations.`
              : html` à l'autre proposition de nominations.`}
        </p> `
      : '';

  return html`
    <h3>${ctx.sessionName}</h3>
    <p>Sous la présidence de ${fullname(ctx.chairman)}&nbsp;:</p>
    ${nonValidated} ${validatedParagraph}
  `;
}

function content(ctx: {
  time: TimeOnly;
  justiceContactName: string;
  secretary: { firstName: string; lastName: string };
  agendas: {
    sessionName: string;
    comment: string | null;
    chairman: { firstName: string; lastName: string };
    nominationFiles: AgendaNominationFile[];
  }[];
}): string {
  return html`
    <h3>Introduction</h3>
    <p>
      Faire confirmer par la DSJ qu’elle renonce au délai de huit jours prévus à
      l’article 35 du décret du 9 mars 1994 pour la fixation de l’ordre du jour.
    </p>

    ${ctx.agendas.map(presentationPlanSessionSection).join('\n')}

    <h3>Informations administratives</h3>
    <ul>
      <li>DSJ&nbsp;: ${ctx.justiceContactName}</li>
      <li>SG&nbsp;: ${fullname(ctx.secretary)}</li>
      <li>
        Heure de début de la séance de restitution&nbsp;:
        ${format(timeOnlyToDate(ctx.time), "HH'h'mm")}
      </li>
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
