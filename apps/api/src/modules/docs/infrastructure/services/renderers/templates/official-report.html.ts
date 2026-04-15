import { stripIndent } from 'common-tags';
import { Gender, Magistrat } from 'shared-models';
import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { DocNominationFileOutcomeEnum } from 'src/modules/docs/domain/doc-nomination-file-outcome';
import { DateOnly } from 'src/utils/date-only';
import { conjunctionList, date, displayTitled, fullname } from '../helpers';
import { commonDocumentCss, documentLayout } from './common.html';

const html = stripIndent;

function header(ctx: {
  formation: Magistrat.Formation;
  sessionMeetingDate: DateOnly;
}): string {
  return html`
    <h1>
      Procès-verbal de restitution de la séance du
      ${date(ctx.sessionMeetingDate, 'dd/MM/yyyy')} tenue à Paris au Conseil
      supérieur de la magistrature
    </h1>
    <p class="formation">
      ${ctx.formation === Magistrat.Formation.SIEGE
        ? `Formation compétente à l'égard des magistrats du siège`
        : `Formation compétente à l'égard des magistrats du parquet`}
    </p>
  `;
}

type OfficialReportNominationFile = {
  name: string;
  currentPosition: string | null;
  currentGrade: string;
  targetedPosition: string;
  targetedGrade: string;
  reporters: readonly string[];
  outcome: DocNominationFileOutcomeEnum;
};

function displayOutcome(ctx: {
  formation: Magistrat.Formation;
  outcome: DocNominationFileOutcomeEnum;
}): string {
  switch (ctx.outcome) {
    case 'NON_VALIDATED':
      switch (ctx.formation) {
        case Magistrat.Formation.PARQUET:
          return 'Avis défavorable(s)';
        default:
          return 'Avis non conforme(s)';
      }

    case 'VALIDATED':
      switch (ctx.formation) {
        case Magistrat.Formation.PARQUET:
          return 'Avis favorable(s)';
        default:
          return 'Avis conforme(s)';
      }

    case 'WITHDRAWN':
      return 'Retrait(s)';

    case 'SUSPENDED':
      return 'Sursis';
  }
}

function officialReportNominationParagraph(ctx: {
  formation: Magistrat.Formation;
  file: OfficialReportNominationFile;
}): string {
  const currentPosition = ctx.file.currentPosition
    ? `, actuellement ${ctx.file.currentPosition} (${ctx.file.currentGrade})`
    : '';

  const targetedPosition = ctx.file.targetedPosition
    ? `, au poste de ${ctx.file.targetedPosition} (${ctx.file.targetedGrade})`
    : '';

  const reporters =
    ctx.file.reporters.length > 0
      ? `, au rapport de ${conjunctionList(ctx.file.reporters)}`
      : '';

  return html`<p class="file">
    <strong>${ctx.file.name}</strong
    >${currentPosition}${targetedPosition}${reporters}.
  </p>`;
}

function content(ctx: {
  hasRenouncement: boolean;
  formation: Magistrat.Formation;
  justiceDepartmentContact: string;
  agendaDate: DateOnly;
  sessionDate: DateOnly;
  sessionMeetingTime: { hours: number; minutes: number };
  secretary: {
    firstName: string;
    lastName: string;
    gender: Gender;
    displayTitle: string | null;
    title: 'FIRST_SECRETARY' | null;
  };
  members: readonly {
    firstName: string;
    lastName: string;
    gender: Gender;
    displayTitle: string | null;
  }[];
  chairman: {
    firstName: string;
    lastName: string;
    gender: Gender;
    title: Exclude<UserTitleEnum, 'FIRST_SECRETARY'> | null;
    displayTitle: string | null;
  };
  files: readonly OfficialReportNominationFile[];
}): string {
  const presidentTitle =
    ctx.chairman.title === 'DEPUTY_PRESIDENT_PARQUET' ||
    ctx.chairman.title === 'DEPUTY_PRESIDENT_SIEGE'
      ? `président suppléant de la formation`
      : `président de la formation`;

  const intro =
    `<p>Sous la présidence de ${fullname(ctx.chairman)}` +
    (ctx.chairman.displayTitle ? `, ${ctx.chairman.displayTitle}` : '') +
    `, ${presidentTitle}` +
    `, en présence des membres du Conseil supérieur de la magistrature suivants\u00A0:</p>`;

  const membersList = html`
    <ul class="members-list">
      ${ctx.members
        .map((member) => `<li>${displayTitled(member)}</li>`)
        .join('')}
    </ul>
  `;

  const sessionMeetingTime = `${ctx.sessionMeetingTime.hours
    .toString()
    .padStart(2, '0')}h${ctx.sessionMeetingTime.minutes
    .toString()
    .padStart(2, '0')}`;

  const outcomesOrder = new Map(
    (
      [
        'WITHDRAWN',
        'SUSPENDED',
        'NON_VALIDATED',
        'VALIDATED',
      ] as const satisfies DocNominationFileOutcomeEnum[]
    ).map((x, i) => [x, i] as const),
  );

  const outcomes = Map.groupBy(ctx.files, (file) => file.outcome)
    .entries()
    .map(([outcome, files]) => ({
      outcome,
      html: html`<h2>
          ${displayOutcome({ formation: ctx.formation, outcome })}
        </h2>
        ${files
          .map((file) =>
            officialReportNominationParagraph({
              formation: ctx.formation,
              file,
            }),
          )
          .join('\n')}`,
    }))
    .toArray()
    .sort(
      (a, b) =>
        (outcomesOrder.get(a.outcome) ?? 10) -
        (outcomesOrder.get(b.outcome) ?? 10),
    )
    .map(({ html }) => html)
    .join('\n');

  return html`
    <p>${intro}</p>
    ${membersList}
    <p><strong>En présence de&nbsp;:</strong></p>
    <ul class="secretaries">
      <li>
        ${ctx.secretary.gender === Gender.M ? `M.&nbsp;` : `Mme&nbsp;`}
        ${fullname(ctx.secretary)},
        ${ctx.secretary.title === 'FIRST_SECRETARY'
          ? ctx.secretary.gender === Gender.M
            ? `secrétaire général`
            : `secrétaire générale`
          : ctx.secretary.gender === Gender.M
            ? `secrétaire général adjoint`
            : `secrétaire générale adjointe`}
      </li>
      <li>${ctx.justiceDepartmentContact}</li>
    </ul>

    ${ctx.hasRenouncement
      ? html`<p>
          ${ctx.justiceDepartmentContact} indique renonce au délai de
          convocation de huit jours prévus par l'article 35 du décret n°94-199
          du 9&nbsp;mars&nbsp;1994 relatif au Conseil supérieur de la
          magistrature.
        </p>`
      : ''}
    <p>
      À ${sessionMeetingTime}, ${fullname(ctx.chairman)}, ${presidentTitle},
      déclare la séance ouverte.
      ${ctx.chairman.gender === Gender.M ? 'Il' : 'Elle'} fait part des avis
      émis par le Conseil sur les propositions figurant à l'ordre du jour arrêté
      le ${date(ctx.agendaDate)} sur la circulaire de transparence du
      ${date(ctx.sessionDate)}&nbsp;:
    </p>
    ${outcomes}
  `;
}

function footer(ctx: {
  secretary: {
    firstName: string;
    lastName: string;
    gender: Gender;
    displayTitle: string | null;
    title: 'FIRST_SECRETARY' | null;
  };
  chairman: {
    firstName: string;
    lastName: string;
    gender: Gender;
    title: Exclude<UserTitleEnum, 'FIRST_SECRETARY'> | null;
    displayTitle: string | null;
  };
}): string {
  const secretary =
    ctx.secretary.title === 'FIRST_SECRETARY'
      ? ctx.secretary.gender === Gender.M
        ? `le secrétaire général, ${fullname(ctx.secretary)}`
        : `la secrétaire générale, ${fullname(ctx.secretary)}`
      : ctx.secretary.gender === Gender.M
        ? `le secrétaire général adjoint, ${fullname(ctx.secretary)}`
        : `la secrétaire générale adjointe, ${fullname(ctx.secretary)}`;

  const president =
    ctx.chairman.title === 'PRESIDENT_PARQUET' ||
    ctx.chairman.title === 'PRESIDENT_SIEGE'
      ? ctx.chairman.gender === Gender.M
        ? `le président, ${fullname(ctx.chairman)}`
        : `la présidente, ${fullname(ctx.chairman)}`
      : ctx.chairman.gender === Gender.M
        ? `le président suppléant, ${fullname(ctx.chairman)}`
        : `la présidente suppléante, ${fullname(ctx.chairman)}`;

  return html`
    <section class="signatures">
      <p class="secretary-general">${secretary}</p>
      <p class="president">${president}</p>
    </section>
  `;
}

function css() {
  return /* css */ `
    ${commonDocumentCss()}

    h1 {
      font-size: 1rem;
    }

    main {
      h2 {
        font-size: 1.1rem;
        margin-top: 2rem;
        break-after: avoid;
        counter-increment: outcome;
        font-weight: bold;
        font-family: Montserrat, sans-serif;
        color: var(--gold);

        &::before {
          content: counter(outcome) ".";
        }
      }

      ul {
        list-style-type: '-\u00A0';
      }

      p {
        line-height: 1.5rem;
        text-align: justify;
        text-wrap: pretty;
        break-inside: avoid;
      }

      li,
      p.file {
        font-size: 0.8rem;
      }

      p.file {
        text-indent: 2rem;
      }

      .signatures {
        break-before: avoid;
        break-inside: avoid;
        margin-top: 3rem;
        font-size: 0.8rem;

        display: flex;
        flex-direction: row;
        justify-content: space-between;
        row-gap: 10rem;

        p {
          text-indent: 0;
          text-align: left;
          text-wrap: pretty;
          max-width: 33%;
        }
      }
    }
  `;
}

export const officialReportTemplate = documentLayout({
  css,
  header,
  content,
  footer,
});
