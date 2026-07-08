import { stripIndent } from 'common-tags';

import { Gender, Magistrat } from 'shared-models';

import { conjunctionList, date, displayTitled, fullname, requiresElision } from '../helpers';
import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { DocNominationFileOutcomeEnum } from 'src/modules/docs/domain/doc-nomination-file-outcome';
import { DateOnly } from 'src/utils/date-only';
import { unaccent } from 'src/utils/unaccent';

import { commonDocumentCss, documentLayout } from './common.html';

const html = stripIndent;

function header(ctx: { formation: Magistrat.Formation; sessionMeetingDate: DateOnly }): string {
  return html`
    <h1>
      Procès-verbal de restitution de la séance du ${date(ctx.sessionMeetingDate, 'dd/MM/yyyy')} tenue à Paris
      au Conseil supérieur de la magistrature
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

function officialReportNominationParagraph(ctx: {
  formation: Magistrat.Formation;
  file: OfficialReportNominationFile;
}): string {
  const currentPosition = ctx.file.currentPosition
    ? `, actuellement ${ctx.file.currentPosition} (${ctx.file.currentGrade})`
    : '';

  const targetedPosition = ctx.file.targetedPosition
    ? `, au poste ${requiresElision(ctx.file.targetedPosition) ? `d'` : 'de '}${ctx.file.targetedPosition} (${ctx.file.targetedGrade})`
    : '';

  const reporters =
    ctx.file.reporters.length > 0 ? `, au rapport de ${conjunctionList(ctx.file.reporters)}` : '';

  return html`<li><strong>${ctx.file.name}</strong>${currentPosition}${targetedPosition}${reporters}.</li>`;
}

function displayPresidentTitle(ctx: {
  formation: Magistrat.Formation;
  chairman: {
    firstName: string;
    lastName: string;
    gender: Gender;
    title: Exclude<UserTitleEnum, 'FIRST_SECRETARY'> | null;
    displayTitle: string | null;
  };
}): string | null {
  if (!ctx.chairman.title) return null;

  const formationLabel = ctx.formation === Magistrat.Formation.PARQUET ? 'parquet' : 'siège';
  const presidentTitle =
    ctx.chairman.title === 'DEPUTY_PRESIDENT_PARQUET' || ctx.chairman.title === 'DEPUTY_PRESIDENT_SIEGE'
      ? ctx.chairman.gender === Gender.M
        ? `président suppléant de la formation ${formationLabel}`
        : `présidente suppléante de la formation ${formationLabel}`
      : ctx.chairman.gender === Gender.M
        ? `président de la formation ${formationLabel}`
        : `présidente de la formation ${formationLabel}`;

  return presidentTitle;
}

function content(ctx: {
  hasRenouncement: boolean;
  formation: Magistrat.Formation;
  justiceDepartmentContact: string;
  agendaDate: DateOnly;
  sessionDate: DateOnly;
  sessionMeetingTime: { hours: number; minutes: number };
  secretary: {
    id: string | null;
    firstName: string;
    lastName: string;
    gender: Gender;
    displayTitle: string | null;
    title: 'FIRST_SECRETARY' | null;
  };
  members: readonly {
    id: string | null;
    firstName: string;
    lastName: string;
    gender: Gender;
    displayTitle: string | null;
    isAbsent: boolean;
    sort: number;
  }[];
  chairman: {
    id: string | null;
    firstName: string;
    lastName: string;
    gender: Gender;
    title: Exclude<UserTitleEnum, 'FIRST_SECRETARY'> | null;
    displayTitle: string | null;
  };
  files: readonly OfficialReportNominationFile[];
}): string {
  const presidentTitle = displayPresidentTitle(ctx);

  const intro =
    `<p>Sous la présidence de ${fullname(ctx.chairman)}` +
    (ctx.chairman.displayTitle ? `, ${ctx.chairman.displayTitle}` : '') +
    (presidentTitle ? `, ${presidentTitle}` : '') +
    `, en présence des membres du Conseil supérieur de la magistrature suivants\u00A0:</p>`;

  const membersList = html`
    <ul>
      ${ctx.members
        .filter((member) => ctx.chairman.id === null || member.id === null || member.id !== ctx.chairman.id)
        .filter((member) => !member.isAbsent)
        .sort((a, b) => a.sort - b.sort || unaccent(a.lastName).localeCompare(unaccent(b.lastName)))
        .map((member) => `<li>${displayTitled(member)}</li>`)
        .join('')}
    </ul>
  `;

  const sessionMeetingTime = `${ctx.sessionMeetingTime.hours
    .toString()
    .padStart(2, '0')}:${ctx.sessionMeetingTime.minutes.toString().padStart(2, '0')}`;

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
      html: html`<h2>${displayOutcomeTitle({ formation: ctx.formation, outcome, count: files.length })}</h2>
        <p>${outcomeSectionIntro({ formation: ctx.formation, filesCount: files.length, outcome })}</p>
        <ol>
          ${files
            .map((file) =>
              officialReportNominationParagraph({
                formation: ctx.formation,
                file,
              }),
            )
            .join('\n')}
        </ol>`,
    }))
    .toArray()
    .sort((a, b) => (outcomesOrder.get(a.outcome) ?? 10) - (outcomesOrder.get(b.outcome) ?? 10))
    .map(({ html }) => html)
    .join('\n');

  return html`
    ${intro} ${membersList}
    <p><strong>En présence de&nbsp;:</strong></p>
    <ul>
      <li>
        ${ctx.secretary.gender === Gender.M ? `M.&nbsp;` : `Mme&nbsp;`}${fullname(ctx.secretary)},
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
          ${ctx.justiceDepartmentContact}, indique renoncer au délai de convocation de huit jours prévus par
          l'article 35 du décret n°94-199 du 9&nbsp;mars&nbsp;1994 relatif au Conseil supérieur de la
          magistrature.
        </p>`
      : ''}
    <p>
      À ${sessionMeetingTime}, ${fullname(ctx.chairman)}${presidentTitle ? `, ${presidentTitle}` : ''},
      déclare la séance ouverte. ${ctx.chairman.gender === Gender.M ? 'Il' : 'Elle'} fait part des avis émis
      par le Conseil sur les propositions figurant à l'ordre du jour arrêté le
      ${date(ctx.agendaDate, 'do MMMM yyyy')} sur la circulaire de transparence du
      ${date(ctx.sessionDate, 'do MMMM yyyy')}&nbsp;:
    </p>
    ${outcomes}
  `;
}

function footer(ctx: {
  formation: Magistrat.Formation;
  sessionMeetingEndTime: { hours: number; minutes: number };
  secretary: {
    id: string | null;
    firstName: string;
    lastName: string;
    gender: Gender;
    displayTitle: string | null;
    title: 'FIRST_SECRETARY' | null;
  };
  chairman: {
    id: string | null;
    firstName: string;
    lastName: string;
    gender: Gender;
    title: Exclude<UserTitleEnum, 'FIRST_SECRETARY'> | null;
    displayTitle: string | null;
  };
}): string {
  const endTime = [ctx.sessionMeetingEndTime.hours, ctx.sessionMeetingEndTime.minutes]
    .map((x) => x.toString().padStart(2, '0'))
    .join(':');

  const presidentTitle = displayPresidentTitle(ctx);

  const secretary =
    ctx.secretary.title === 'FIRST_SECRETARY'
      ? ctx.secretary.gender === Gender.M
        ? `le secrétaire général,`
        : `la secrétaire générale,`
      : ctx.secretary.gender === Gender.M
        ? `le secrétaire général adjoint,`
        : `la secrétaire générale adjointe,`;

  const president =
    ctx.chairman.title === 'PRESIDENT_PARQUET' || ctx.chairman.title === 'PRESIDENT_SIEGE'
      ? ctx.chairman.gender === Gender.M
        ? `le président,`
        : `la présidente,`
      : ctx.chairman.title === 'DEPUTY_PRESIDENT_PARQUET' || ctx.chairman.title === 'DEPUTY_PRESIDENT_SIEGE'
        ? ctx.chairman.gender === Gender.M
          ? `le président suppléant,`
          : `la présidente suppléante,`
        : '';

  return html`
    <p class="end-time">
      <em
        >À ${endTime}, ${fullname(ctx.chairman)}${presidentTitle ? `, ${presidentTitle}` : ''}, clôture la
        séance.</em
      >
    </p>
    <section class="signatures">
      <div>
        <p class="secretary-general">${secretary}</p>
        <p class="secretary-general">${fullname(ctx.secretary)}</p>
      </div>
      <div>
        <p class="president">${president}</p>
        <p class="president">${fullname(ctx.chairman)}</p>
      </div>
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
        font-weight: bold;
        font-family: Montserrat, sans-serif;
        color: var(--gold);
      }

      ul {
        list-style-type: '-\u00A0';
        padding-left: 1rem;
      }

      ol {
        list-style: none;
        padding-left: 1rem;
        break-before: avoid;
      }

      p {
        font-size: 0.8rem;
        line-height: 1.5rem;
        text-align: justify;
        text-wrap: pretty;
        break-inside: avoid;
        text-indent: 0;
      }

      li {
        font-size: 0.8rem;
        break-inside: avoid;
        line-height: 1.5rem;
      }

      li + li {
        margin-top: 1rem;
      }

      .footer {
        break-before: avoid;
        break-inside: avoid;
      }

      .footer p.end-time {
        margin: 3rem 0 1rem 0;
        font-size: 0.8rem;
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

        div {
          max-width: 33%;

          p {
            margin: 0;
            text-indent: 0;
            text-align: left;
            text-wrap: pretty;
          }
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

function displayOutcomeTitle(ctx: {
  count: number;
  formation: Magistrat.Formation;
  outcome: DocNominationFileOutcomeEnum;
}): string {
  switch (ctx.outcome) {
    case 'NON_VALIDATED':
      switch (ctx.formation) {
        case Magistrat.Formation.PARQUET:
          return ctx.count > 1 ? 'Avis défavorables' : 'Avis défavorable';
        default:
          return ctx.count > 1 ? 'Avis non conformes' : 'Avis non conforme';
      }

    case 'VALIDATED':
      switch (ctx.formation) {
        case Magistrat.Formation.PARQUET:
          return ctx.count > 1 ? 'Avis favorables' : 'Avis favorable';
        default:
          return ctx.count > 1 ? 'Avis conformes' : 'Avis conforme';
      }

    case 'WITHDRAWN':
      return ctx.count > 1 ? 'Retraits' : 'Retrait';

    case 'SUSPENDED':
      return 'Sursis';
  }
}

function outcomeSectionIntro(ctx: {
  outcome: DocNominationFileOutcomeEnum;
  formation: Magistrat.Formation;
  filesCount: number;
}): string {
  switch (ctx.outcome) {
    case 'VALIDATED':
    case 'NON_VALIDATED':
      return `Le Conseil a émis un ${displayOutcomeTitle({ ...ctx, count: 1 }).toLowerCase()} sur ${
        ctx.filesCount > 1
          ? /* html */ `les propositions de nomination suivantes&nbsp;:`
          : /* html */ `la proposition de nomination suivante&nbsp;:`
      }`;

    case 'SUSPENDED':
      return `Le Conseil sursoit à statuer sur ${
        ctx.filesCount > 1
          ? /* html */ `les propositions de nomination suivantes&nbsp;:`
          : /* html */ `la proposition de nomination suivante&nbsp;:`
      }`;

    case 'WITHDRAWN':
      return `Le Conseil constate le retrait ${
        ctx.filesCount > 1
          ? /* html */ `des propositions de nomination suivantes&nbsp;:`
          : /* html */ `de la proposition de nomination suivante&nbsp;:`
      }`;
  }
}
