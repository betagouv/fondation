import { oneLine } from 'common-tags';

import {
  commonDocumentCss,
  documentLayout,
} from '../../../../shared/infrastructure/services/renderers/common.html';
import {
  conjunctionList,
  date,
  displayTitled,
  fullname,
  requiresElision,
} from '../../../../shared/infrastructure/services/renderers/helpers';
import { Template } from '../../../../shared/infrastructure/services/renderers/templates.types';
import type { DocBlock } from '../../../domain/official-report-doc-block';
import { OfficialReportChairman } from 'src/modules/docs/official-report/domain/official-report-chairman';
import { OfficialReportMembersList } from 'src/modules/docs/official-report/domain/official-report-member-list';
import { OfficialReportSecretary } from 'src/modules/docs/official-report/domain/official-report-secretary';
import { OfficialReportSessionMeeting } from 'src/modules/docs/official-report/domain/official-report-session-meeting';
import { DocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { DateOnly } from 'src/utils/date-only';
import { Id } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';

type NominationFileId = Id<'NominationFileId'>;

type OfficialReportRenderContextNominationFile = {
  id: bigint;
  number: number;
  nominationFileId: NominationFileId | null;

  name: string;
  currentPosition: string | null;
  currentGrade: string;
  targetedPosition: string;
  targetedGrade: string;
  reporters: readonly string[];
  outcome: DocNominationFileOutcomeEnum;
};

export type OfficialReportRenderContext = {
  session: { id: string; date: DateOnly };
  agenda: { id: string; date: DateOnly; formation: FormationEnum };

  hasRenouncement: boolean;
  justiceDepartmentContact: string;

  chairman: OfficialReportChairman;
  secretary: OfficialReportSecretary;
  members: OfficialReportMembersList;
  sessionMeeting: OfficialReportSessionMeeting;

  files: readonly OfficialReportRenderContextNominationFile[];

  userDefinedBlocks: {
    intro: { html: string; isOutdated: boolean } | undefined;
    conclusion: { html: string; isOutdated: boolean } | undefined;
    files: Record<NominationFileId, { html: string; isOutdated: boolean }>;
    outcomes: {
      [K in DocNominationFileOutcomeEnum]?: {
        [KK in 'title' | 'intro']?: { html: string; isOutdated: boolean };
      };
    };
  };
};

const html = oneLine;

function header(ctx: OfficialReportRenderContext): string {
  return html`
    <h1>
      Procès-verbal de restitution de la séance du ${date(ctx.sessionMeeting.date, 'dd/MM/yyyy')} tenue à
      Paris au Conseil supérieur de la magistrature
    </h1>
    <p class="formation">
      ${ctx.agenda.formation === 'SIEGE'
        ? `Formation compétente à l'égard des magistrats du siège`
        : `Formation compétente à l'égard des magistrats du parquet`}
    </p>
  `;
}

function displayFileContent(ctx: {
  file: OfficialReportRenderContextNominationFile;
  root: OfficialReportRenderContext;
  ignoreUserDefinedContent?: true;
}): string {
  const userDefinedFileContent = ctx.file.nominationFileId
    ? ctx.root.userDefinedBlocks.files[ctx.file.nominationFileId]?.html
    : undefined;
  if (!ctx.ignoreUserDefinedContent && userDefinedFileContent) return userDefinedFileContent;

  const currentPosition = ctx.file.currentPosition
    ? `, actuellement ${ctx.file.currentPosition} (${ctx.file.currentGrade})`
    : '';

  const targetedPosition = ctx.file.targetedPosition
    ? `, au poste ${requiresElision(ctx.file.targetedPosition) ? `d'` : 'de '}${ctx.file.targetedPosition} (${ctx.file.targetedGrade})`
    : '';

  const reporters =
    ctx.file.reporters.length > 0 ? `, au rapport de ${conjunctionList(ctx.file.reporters)}` : '';

  return html`<strong>${ctx.file.name}</strong>${currentPosition}${targetedPosition}${reporters}.`;
}

function displayChairmanTitle(ctx: OfficialReportRenderContext): string | null {
  if (!ctx.chairman.title) return null;

  const formationLabel = ctx.agenda.formation === 'PARQUET' ? 'parquet' : 'siège';
  const presidentTitle =
    ctx.chairman.title === 'DEPUTY_PRESIDENT_PARQUET' || ctx.chairman.title === 'DEPUTY_PRESIDENT_SIEGE'
      ? ctx.chairman.gender === 'MALE'
        ? `président suppléant de la formation ${formationLabel}`
        : `présidente suppléante de la formation ${formationLabel}`
      : ctx.chairman.gender === 'MALE'
        ? `président de la formation ${formationLabel}`
        : `présidente de la formation ${formationLabel}`;

  return presidentTitle;
}

function displayIntroduction(
  ctx: OfficialReportRenderContext,
  opts?: { ignoreUserDefinedContent?: true },
): string {
  if (!opts?.ignoreUserDefinedContent && ctx.userDefinedBlocks.intro?.html)
    return ctx.userDefinedBlocks.intro.html;

  const presidentTitle = displayChairmanTitle(ctx);

  const intro = [
    `<p>Sous la présidence de ${fullname(ctx.chairman)}`,
    ctx.chairman.displayTitle,
    presidentTitle,
    `en présence des membres du Conseil supérieur de la magistrature suivants\u00A0:</p>`,
  ]
    .filter(Boolean)
    .join(', ');

  const membersList = html`<ul>
    ${ctx.members
      .toSortedArray()
      .filter((member) => !member.isAbsent && (ctx.chairman.id === null || member.id !== ctx.chairman.id))
      .map((member) => `<li>${displayTitled(member)}</li>`)
      .join('')}
  </ul>`;

  const secretary =
    (ctx.secretary.gender === 'MALE' ? `M.&nbsp;` : `Mme&nbsp;`) +
    fullname(ctx.secretary) +
    ', ' +
    (ctx.secretary.title === 'FIRST_SECRETARY'
      ? ctx.secretary.gender === 'MALE'
        ? `secrétaire général`
        : `secrétaire générale`
      : ctx.secretary.gender === 'MALE'
        ? `secrétaire général adjoint`
        : `secrétaire générale adjointe`);

  const renouncement = ctx.hasRenouncement
    ? html`<p>
        ${ctx.justiceDepartmentContact}, indique renoncer au délai de convocation de huit jours prévus par
        l'article 35 du décret n°94-199 du 9&nbsp;mars&nbsp;1994 relatif au Conseil supérieur de la
        magistrature.
      </p>`
    : '';

  const { hours, minutes } = ctx.sessionMeeting.start;
  const sessionMeetingTime = [hours, minutes].map((x) => x.toString().padStart(2, '0')).join(':');
  const opening = html`<p>
    À ${sessionMeetingTime}, ${fullname(ctx.chairman)}${presidentTitle ? `, ${presidentTitle}` : ''}, déclare
    la séance ouverte. ${ctx.chairman.gender === 'MALE' ? 'Il' : 'Elle'} fait part des avis émis par le
    Conseil sur les propositions figurant à l'ordre du jour arrêté le ${date(ctx.agenda.date, 'do MMMM yyyy')}
    sur la circulaire de transparence du ${date(ctx.session.date, 'do MMMM yyyy')}&nbsp;:
  </p>`;

  return (
    intro +
    membersList +
    html`<p><strong>En présence de&nbsp;:</strong></p>` +
    html`<ul>
      <li>${secretary}</li>
      <li>${ctx.justiceDepartmentContact}</li>
    </ul>` +
    renouncement +
    opening
  );
}

const OUTCOME_ORDER = new Map<DocNominationFileOutcomeEnum, number>([
  ['WITHDRAWN', 1_000],
  ['SUSPENDED', 2_000],
  ['NON_VALIDATED', 3_000],
  ['VALIDATED', 4_000],
] as const);

function groupFilesByOutcome(
  ctx: OfficialReportRenderContext,
): { outcome: DocNominationFileOutcomeEnum; files: readonly OfficialReportRenderContextNominationFile[] }[] {
  return Map.groupBy(ctx.files, (file) => file.outcome)
    .entries()
    .map(([outcome, files]) => ({ outcome, files }))
    .toArray()
    .sort((a, b) => (OUTCOME_ORDER.get(a.outcome) ?? 10) - (OUTCOME_ORDER.get(b.outcome) ?? 10));
}

function displaySectionTitle(ctx: {
  root: OfficialReportRenderContext;
  outcome: DocNominationFileOutcomeEnum;
  count: number;
}): string {
  return (
    ctx.root.userDefinedBlocks.outcomes[ctx.outcome]?.title?.html ??
    displayOutcome({ formation: ctx.root.agenda.formation, outcome: ctx.outcome, count: ctx.count })
  );
}

function displaySectionIntro(ctx: {
  count: number;
  outcome: DocNominationFileOutcomeEnum;
  root: OfficialReportRenderContext;
}): string {
  const userDefinedSectionIntro = ctx.root.userDefinedBlocks.outcomes[ctx.outcome]?.intro?.html;
  if (userDefinedSectionIntro) return userDefinedSectionIntro;

  switch (ctx.outcome) {
    case 'VALIDATED':
    case 'NON_VALIDATED': {
      const outcome = displayOutcome({
        formation: ctx.root.agenda.formation,
        outcome: ctx.outcome,
        count: 1,
      }).toLowerCase();
      return `<p>Le Conseil a émis un ${outcome} sur ${
        ctx.count > 1
          ? `les propositions de nomination suivantes&nbsp;:`
          : `la proposition de nomination suivante&nbsp;:`
      }</p>`;
    }

    case 'SUSPENDED':
      return `<p>Le Conseil sursoit à statuer sur ${
        ctx.count > 1
          ? `les propositions de nomination suivantes&nbsp;:`
          : `la proposition de nomination suivante&nbsp;:`
      }</p>`;

    case 'WITHDRAWN':
      return `<p>Le Conseil constate le retrait ${
        ctx.count > 1
          ? `des propositions de nomination suivantes&nbsp;:`
          : `de la proposition de nomination suivante&nbsp;:`
      }</p>`;
  }
}

function content(ctx: OfficialReportRenderContext): string {
  const introContent = displayIntroduction(ctx);

  const sections = groupFilesByOutcome(ctx)
    .map(
      ({ outcome, files }) => html`
        <h2>${displaySectionTitle({ root: ctx, count: files.length, outcome })}</h2>
        ${displaySectionIntro({ root: ctx, count: files.length, outcome })}
        <ol>
          ${files.map((file) => /* html */ `<li>${displayFileContent({ file, root: ctx })}</li>`).join('\n')}
        </ol>
      `,
    )
    .join('\n');

  return html` ${introContent} ${sections} `;
}

function displayConclusion(
  ctx: OfficialReportRenderContext,
  opts?: { ignoreUserDefinedContent?: true },
): string {
  const userDefinedConclusion = ctx.userDefinedBlocks.conclusion?.html;
  if (!opts?.ignoreUserDefinedContent && userDefinedConclusion) return userDefinedConclusion;

  const { hours, minutes } = ctx.sessionMeeting.end;
  const endTime = [hours, minutes].map((x) => x.toString().padStart(2, '0')).join(':');

  const presidentTitle = displayChairmanTitle(ctx);

  return /* html */ `<p class="end-time"><em>À ${endTime}, ${fullname(ctx.chairman)}${presidentTitle ? `, ${presidentTitle}` : ''}, clôture la séance.</em></p>`;
}

function displayFooterSignatures(ctx: OfficialReportRenderContext): string {
  const secretary =
    ctx.secretary.title === 'FIRST_SECRETARY'
      ? ctx.secretary.gender === 'MALE'
        ? `le secrétaire général,`
        : `la secrétaire générale,`
      : ctx.secretary.gender === 'MALE'
        ? `le secrétaire général adjoint,`
        : `la secrétaire générale adjointe,`;

  const president =
    ctx.chairman.title === 'PRESIDENT_PARQUET' || ctx.chairman.title === 'PRESIDENT_SIEGE'
      ? ctx.chairman.gender === 'MALE'
        ? `le président,`
        : `la présidente,`
      : ctx.chairman.title === 'DEPUTY_PRESIDENT_PARQUET' || ctx.chairman.title === 'DEPUTY_PRESIDENT_SIEGE'
        ? ctx.chairman.gender === 'MALE'
          ? `le président suppléant,`
          : `la présidente suppléante,`
        : '';

  return html`
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

function footer(ctx: OfficialReportRenderContext): string {
  const conclusion = displayConclusion(ctx);
  const signatures = displayFooterSignatures(ctx);

  return `${conclusion}\n${signatures}`;
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

export const officialReportTemplate: Template<OfficialReportRenderContext> = documentLayout({
  css,
  header,
  content,
  footer,
} as any) as any;

function displayOutcome(ctx: {
  count: number;
  formation: FormationEnum;
  outcome: DocNominationFileOutcomeEnum;
}): string {
  switch (ctx.outcome) {
    case 'NON_VALIDATED':
      switch (ctx.formation) {
        case 'PARQUET':
          return ctx.count > 1 ? 'Avis défavorables' : 'Avis défavorable';
        default:
          return ctx.count > 1 ? 'Avis non conformes' : 'Avis non conforme';
      }

    case 'VALIDATED':
      switch (ctx.formation) {
        case 'PARQUET':
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

export function* officialReportBlocks(ctx: OfficialReportRenderContext): Iterable<DocBlock> {
  const introOutdated = Boolean(ctx.userDefinedBlocks.intro?.isOutdated);
  yield {
    kind: 'intro',
    weight: 0,
    html: displayIntroduction(ctx),
    edited: isDefined(ctx.userDefinedBlocks.intro),
    outdated: introOutdated,
    generatedHtml: introOutdated ? displayIntroduction(ctx, { ignoreUserDefinedContent: true }) : undefined,
  };

  for (const { outcome, files } of groupFilesByOutcome(ctx)) {
    let outcomeWeight = OUTCOME_ORDER.get(outcome);
    if (!isDefined(outcomeWeight)) continue;

    yield {
      kind: 'section-title',
      outcome,
      outdated: false,
      weight: outcomeWeight++,
      text: displaySectionTitle({ root: ctx, count: files.length, outcome }),
      edited: isDefined(ctx.userDefinedBlocks.outcomes[outcome]?.title),
    };

    yield {
      outcome,
      kind: 'section-intro',
      outdated: Boolean(ctx.userDefinedBlocks.outcomes[outcome]?.intro?.isOutdated),
      edited: isDefined(ctx.userDefinedBlocks.outcomes[outcome]?.intro?.html),
      weight: outcomeWeight++,
      html: displaySectionIntro({ count: files.length, outcome, root: ctx }),
    };

    for (const file of files) {
      const userDefinedFile = file.nominationFileId
        ? ctx.userDefinedBlocks.files[file.nominationFileId]
        : undefined;
      const outdated = Boolean(userDefinedFile?.isOutdated);
      yield {
        kind: 'file',
        outdated,
        weight: outcomeWeight++,
        nominationFileId: file.nominationFileId,
        html: displayFileContent({ file, root: ctx }),
        edited: Boolean(userDefinedFile?.html),
        generatedHtml:
          outdated && file.nominationFileId
            ? displayFileContent({
                file,
                root: ctx,
                ignoreUserDefinedContent: true,
              })
            : undefined,
      };
    }
  }

  const conclusionOutdated = Boolean(ctx.userDefinedBlocks.conclusion?.isOutdated);
  yield {
    kind: 'conclusion',
    weight: 1e6,
    html: displayConclusion(ctx),
    edited: isDefined(ctx.userDefinedBlocks.conclusion),
    outdated: conclusionOutdated,
    generatedHtml: conclusionOutdated
      ? displayConclusion(ctx, { ignoreUserDefinedContent: true })
      : undefined,
  };
}
