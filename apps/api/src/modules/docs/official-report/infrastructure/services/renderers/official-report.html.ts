import { DateOnly } from '../../../../../../utils/date-only';
import { Id } from '../../../../../../utils/id';
import { isDefined } from '../../../../../../utils/is-defined';
import { fullname } from '../../../../../../utils/user.util';
import {
  adminUserRoleLabel,
  type ChairmanRole,
  chairmanRoleLabel,
  signatoryRoleLabel,
} from '../../../../../shared/admin-user-role.enum';
import { FormationEnum } from '../../../../../shared/formation.enum';
import {
  DocNominationFileOutcomeEnum,
  docNominationFileOutcomeSectionTitle,
} from '../../../../shared/domain/doc-nomination-file-outcome';
import {
  commonDocumentCss,
  documentLayout,
} from '../../../../shared/infrastructure/services/renderers/common.html';
import {
  conjunctionList,
  date,
  displayTitled,
  lowerFirst,
  readsTheSame,
  requiresElision,
} from '../../../../shared/infrastructure/services/renderers/helpers';
import { html, SafeHtml } from '../../../../shared/infrastructure/services/renderers/safe-html';
import { Template } from '../../../../shared/infrastructure/services/renderers/templates.types';
import { OfficialReportChairman } from '../../../domain/official-report-chairman';
import type { DocBlock } from '../../../domain/official-report-doc-block';
import { OfficialReportMembersList } from '../../../domain/official-report-member-list';
import { OfficialReportSecretary } from '../../../domain/official-report-secretary';
import { OfficialReportSessionMeeting } from '../../../domain/official-report-session-meeting';

type NominationFileId = Id<'NominationFileId'>;

type OfficialReportRenderContextNominationFile = {
  currentGrade: string;
  currentPosition: string | null;
  id: bigint;
  name: string;
  nominationFileId: NominationFileId | null;
  note: { editedAt: Date | null; editedBy: { id: string; name: string } | null; html: string } | null;
  number: number;
  outcome: DocNominationFileOutcomeEnum;
  reporters: readonly string[];
  targetedGrade: string;
  targetedPosition: string;
};

export type OfficialReportRenderContext = {
  agenda: { date: DateOnly; formation: FormationEnum; id: string; propositionCount: number };
  /** the sentence the agenda carries for a file: what the report's block is offered when they part ways */
  agendaProposals: ReadonlyMap<
    string,
    { at: Date | null; by: { id: string; name: string } | null; html: string }
  >;
  chairman: OfficialReportChairman;
  /** the agenda each proposition comes from, where its sentence is written */
  fileAgendas: ReadonlyMap<string, string>;
  files: readonly OfficialReportRenderContextNominationFile[];
  hasRenouncement: boolean;
  justiceDepartmentContact: string;
  members: OfficialReportMembersList;
  secretary: OfficialReportSecretary;
  session: { date: DateOnly; id: string };
  sessionMeeting: OfficialReportSessionMeeting;
  userDefinedBlocks: {
    conclusion: { html: string; isOutdated: boolean } | undefined;
    files: Record<
      NominationFileId,
      {
        editedAt: Date | null;
        editedBy: { id: string; name: string } | null;
        fromAgenda: boolean;
        html: string | null;
        isOutdated: boolean;
      }
    >;
    intro: { html: string; isOutdated: boolean } | undefined;
    outcomes: {
      [K in DocNominationFileOutcomeEnum]?: {
        [KK in 'title' | 'intro']?: { html: string; isOutdated: boolean };
      };
    };
  };
};

function header(ctx: OfficialReportRenderContext): SafeHtml {
  return html`
    <h1>
      Procès-verbal de restitution de la séance du ${date(ctx.sessionMeeting.date, 'do MMMM yyyy')} tenue à
      Paris au Conseil supérieur de la magistrature
    </h1>
    <p class="formation">
      ${
        ctx.agenda.formation === 'SIEGE'
          ? `Formation compétente à l'égard des magistrats du siège`
          : `Formation compétente à l'égard des magistrats du parquet`
      }
    </p>
  `;
}

function displayFileContent(ctx: {
  file: OfficialReportRenderContextNominationFile;
  ignoreUserDefinedContent?: true;
  root: OfficialReportRenderContext;
}): SafeHtml {
  const userDefinedFileContent = ctx.file.nominationFileId
    ? ctx.root.userDefinedBlocks.files[ctx.file.nominationFileId]?.html
    : undefined;
  if (!ctx.ignoreUserDefinedContent && userDefinedFileContent) return new SafeHtml(userDefinedFileContent);

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

function chairmanRole(chairman: OfficialReportChairman): ChairmanRole | null {
  if (!chairman.title) return null;

  return chairman.title === 'DEPUTY_PRESIDENT_PARQUET' || chairman.title === 'DEPUTY_PRESIDENT_SIEGE'
    ? 'DEPUTY_PRESIDENT'
    : 'PRESIDENT';
}

function displayChairmanTitle(ctx: OfficialReportRenderContext): string | null {
  const role = chairmanRole(ctx.chairman);
  if (!role) return null;

  const formation = ctx.agenda.formation === 'PARQUET' ? 'PARQUET' : 'SIEGE';
  return lowerFirst(adminUserRoleLabel(`${role}_${formation}`, ctx.chairman.gender));
}

function displayIntroduction(
  ctx: OfficialReportRenderContext,
  opts?: { ignoreUserDefinedContent?: true },
): SafeHtml {
  if (!opts?.ignoreUserDefinedContent && ctx.userDefinedBlocks.intro?.html)
    return new SafeHtml(ctx.userDefinedBlocks.intro.html);

  const presidentTitle = displayChairmanTitle(ctx);

  const role = chairmanRole(ctx.chairman);
  const presence = [
    `Sous la présidence ${requiresElision(ctx.chairman.firstName) ? `d'` : 'de '}${fullname(ctx.chairman)}`,
    ctx.chairman.displayTitle,
    role && chairmanRoleLabel(role, ctx.chairman.gender),
    'en présence de\u00A0:',
  ]
    .filter(Boolean)
    .join(', ');
  const intro = html`<p>${presence}</p>`;

  const membersList = html`<ul>
    ${SafeHtml.join(
      ctx.members
        .toSortedArray()
        .filter((member) => !member.isAbsent && (ctx.chairman.id === null || member.id !== ctx.chairman.id))
        .map((member) => html`<li>${displayTitled(member)}</li>`),
    )}
  </ul>`;

  const secretaryTitle = lowerFirst(
    adminUserRoleLabel(ctx.secretary.title ?? 'SECRETARY', ctx.secretary.gender),
  );
  const secretary = html`${ctx.secretary.gender === 'MALE' ? 'M.' : 'Mme'}&nbsp;${fullname(ctx.secretary)},
  ${secretaryTitle}`;

  const renouncement = ctx.hasRenouncement
    ? html`<p>
        ${ctx.justiceDepartmentContact}, indique renoncer au délai de convocation de huit jours prévus par
        l'article 35 du décret n°94-199 du 9&nbsp;mars&nbsp;1994 relatif au Conseil supérieur de la
        magistrature.
      </p>`
    : html``;

  const { hours, minutes } = ctx.sessionMeeting.start;
  const sessionMeetingTime = [hours, minutes].map((x) => x.toString().padStart(2, '0')).join(':');
  const opinions =
    ctx.agenda.propositionCount === 1
      ? html`de l'avis émis par le Conseil sur la proposition figurant`
      : html`des avis émis par le Conseil sur les propositions figurant`;
  const opening = html`<p>
    À ${sessionMeetingTime}, ${fullname(ctx.chairman)}${presidentTitle ? `, ${presidentTitle}` : ''}, déclare
    la séance ouverte. ${ctx.chairman.gender === 'MALE' ? 'Il' : 'Elle'} fait part ${opinions} à l'ordre du
    jour arrêté le ${date(ctx.agenda.date, 'do MMMM yyyy')} sur la circulaire de transparence du
    ${date(ctx.session.date, 'do MMMM yyyy')}&nbsp;:
  </p>`;

  const attendees = html`<ul>
    <li>${secretary}</li>
    <li>${ctx.justiceDepartmentContact}</li>
  </ul>`;

  return SafeHtml.join([
    intro,
    membersList,
    html`<p><strong>En présence de&nbsp;:</strong></p>`,
    attendees,
    renouncement,
    opening,
  ]);
}

const OUTCOME_ORDER = new Map<DocNominationFileOutcomeEnum, number>([
  ['WITHDRAWN', 1_000],
  ['SUSPENDED', 2_000],
  ['NON_VALIDATED', 3_000],
  ['VALIDATED', 4_000],
] as const);

function groupFilesByOutcome(
  ctx: OfficialReportRenderContext,
): { files: readonly OfficialReportRenderContextNominationFile[]; outcome: DocNominationFileOutcomeEnum }[] {
  return Map.groupBy(ctx.files, (file) => file.outcome)
    .entries()
    .map(([outcome, files]) => ({ files: files.sort((a, b) => a.number - b.number), outcome }))
    .toArray()
    .sort((a, b) => (OUTCOME_ORDER.get(a.outcome) ?? 10) - (OUTCOME_ORDER.get(b.outcome) ?? 10));
}

function displaySectionTitle(
  ctx: {
    count: number;
    outcome: DocNominationFileOutcomeEnum;
    root: OfficialReportRenderContext;
  },
  opts?: { ignoreUserDefinedContent?: true },
): string {
  return (
    (opts?.ignoreUserDefinedContent
      ? undefined
      : ctx.root.userDefinedBlocks.outcomes[ctx.outcome]?.title?.html) ??
    docNominationFileOutcomeSectionTitle({
      count: ctx.count,
      formation: ctx.root.agenda.formation,
      outcome: ctx.outcome,
    })
  );
}

function displaySectionIntro(
  ctx: {
    count: number;
    outcome: DocNominationFileOutcomeEnum;
    root: OfficialReportRenderContext;
  },
  opts?: { ignoreUserDefinedContent?: true },
): SafeHtml {
  const userDefinedSectionIntro = ctx.root.userDefinedBlocks.outcomes[ctx.outcome]?.intro?.html;
  if (!opts?.ignoreUserDefinedContent && userDefinedSectionIntro)
    return new SafeHtml(userDefinedSectionIntro);

  const propositions =
    ctx.count > 1
      ? html`les propositions de nomination suivantes&nbsp;:`
      : html`la proposition de nomination suivante&nbsp;:`;

  switch (ctx.outcome) {
    case 'VALIDATED':
    case 'NON_VALIDATED': {
      const outcome = docNominationFileOutcomeSectionTitle({
        count: 1,
        formation: ctx.root.agenda.formation,
        outcome: ctx.outcome,
      }).toLowerCase();
      return html`<p>Le Conseil a émis un ${outcome} sur ${propositions}</p>`;
    }

    case 'SUSPENDED':
      return html`<p>Le Conseil sursoit à statuer sur ${propositions}</p>`;

    case 'WITHDRAWN': {
      const withdrawn =
        ctx.count > 1
          ? html`des propositions de nomination suivantes&nbsp;:`
          : html`de la proposition de nomination suivante&nbsp;:`;
      return html`<p>Le Conseil constate le retrait ${withdrawn}</p>`;
    }
  }
}

function content(ctx: OfficialReportRenderContext): SafeHtml {
  const introContent = displayIntroduction(ctx);

  const sections = SafeHtml.join(
    groupFilesByOutcome(ctx).map(
      ({ files, outcome }) => html`
        <h2>${displaySectionTitle({ count: files.length, outcome, root: ctx })}</h2>
        ${displaySectionIntro({ count: files.length, outcome, root: ctx })}
        <ol>
          ${SafeHtml.join(
            files.map((file) => {
              const note = file.note ? new SafeHtml(file.note.html) : '';
              return html`<li>${displayFileContent({ file, root: ctx })}${note}</li>`;
            }),
            '\n',
          )}
        </ol>
      `,
    ),
    '\n',
  );

  return html` ${introContent} ${sections} `;
}

function displayConclusion(
  ctx: OfficialReportRenderContext,
  opts?: { ignoreUserDefinedContent?: true },
): SafeHtml {
  const userDefinedConclusion = ctx.userDefinedBlocks.conclusion?.html;
  if (!opts?.ignoreUserDefinedContent && userDefinedConclusion) return new SafeHtml(userDefinedConclusion);

  const { hours, minutes } = ctx.sessionMeeting.end;
  const endTime = [hours, minutes].map((x) => x.toString().padStart(2, '0')).join(':');

  const presidentTitle = displayChairmanTitle(ctx);

  const closing = `À ${endTime}, ${fullname(ctx.chairman)}${presidentTitle ? `, ${presidentTitle}` : ''}, clôture la séance.`;

  return html`<p class="end-time"><em>${closing}</em></p>`;
}

function displayFooterSignatures(ctx: OfficialReportRenderContext): SafeHtml {
  const secretary = `${signatoryRoleLabel(ctx.secretary.title ?? 'SECRETARY', ctx.secretary.gender)},`;
  const president = ctx.chairman.title
    ? `${signatoryRoleLabel(ctx.chairman.title, ctx.chairman.gender)},`
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

function footer(ctx: OfficialReportRenderContext): SafeHtml {
  return SafeHtml.join([displayConclusion(ctx), displayFooterSignatures(ctx)], '\n');
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
        margin-top: 10rem;
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
  content,
  css,
  footer,
  header,
} as any) as any;

export function* officialReportBlocks(ctx: OfficialReportRenderContext): Iterable<DocBlock> {
  // every block carries the text the document proposes, so the editor can mark what the reader
  // changes as they type, before anything is saved. An untouched block reads the same both ways.
  const generatedIntro = displayIntroduction(ctx, { ignoreUserDefinedContent: true }).toString();
  const intro = displayIntroduction(ctx).toString();
  yield {
    edited: isDefined(ctx.userDefinedBlocks.intro) && !readsTheSame(intro, generatedIntro),
    generatedHtml: generatedIntro,
    html: intro,
    kind: 'intro',
    outdated: Boolean(ctx.userDefinedBlocks.intro?.isOutdated),
    weight: 0,
  };

  for (const { files, outcome } of groupFilesByOutcome(ctx)) {
    let outcomeWeight = OUTCOME_ORDER.get(outcome);
    if (!isDefined(outcomeWeight)) continue;

    const section = { count: files.length, outcome, root: ctx };
    const title = displaySectionTitle(section);
    const storedTitle = ctx.userDefinedBlocks.outcomes[outcome]?.title?.html;
    yield {
      edited:
        isDefined(storedTitle) &&
        !readsTheSame(title, displaySectionTitle(section, { ignoreUserDefinedContent: true })),
      kind: 'section-title',
      outcome,
      outdated: false,
      text: title,
      weight: outcomeWeight++,
    };

    const sectionIntro = displaySectionIntro(section).toString();
    const storedSectionIntro = ctx.userDefinedBlocks.outcomes[outcome]?.intro?.html;
    yield {
      edited:
        isDefined(storedSectionIntro) &&
        !readsTheSame(
          sectionIntro,
          displaySectionIntro(section, { ignoreUserDefinedContent: true }).toString(),
        ),
      html: sectionIntro,
      kind: 'section-intro',
      outcome,
      outdated: Boolean(ctx.userDefinedBlocks.outcomes[outcome]?.intro?.isOutdated),
      weight: outcomeWeight++,
    };

    for (const file of files) {
      const userDefinedFile = file.nominationFileId
        ? ctx.userDefinedBlocks.files[file.nominationFileId]
        : undefined;
      const templateFile = displayFileContent({ file, ignoreUserDefinedContent: true, root: ctx }).toString();
      const fileContent = displayFileContent({ file, root: ctx }).toString();
      const editedFile = Boolean(userDefinedFile?.html) && !readsTheSame(fileContent, templateFile);

      const agendaProposal = file.nominationFileId
        ? ctx.agendaProposals.get(file.nominationFileId)
        : undefined;

      yield {
        agendaEditedAt: agendaProposal?.at?.toISOString() ?? null,
        agendaEditedBy: agendaProposal?.by ?? null,
        agendaHtml: agendaProposal?.html ?? null,
        agendaId: file.nominationFileId ? (ctx.fileAgendas.get(file.nominationFileId) ?? null) : null,
        edited: editedFile,
        editedAt: editedFile ? (userDefinedFile?.editedAt?.toISOString() ?? null) : null,
        editedBy: editedFile ? (userDefinedFile?.editedBy ?? null) : null,
        fromAgenda: editedFile && Boolean(userDefinedFile?.fromAgenda),
        generatedHtml: templateFile,
        html: fileContent,
        kind: 'file',
        name: file.name,
        nominationFileId: file.nominationFileId,
        note: file.note && { ...file.note, editedAt: file.note.editedAt?.toISOString() ?? null },
        outdated: Boolean(userDefinedFile?.isOutdated),
        weight: outcomeWeight++,
      };
    }
  }

  const generatedConclusion = displayConclusion(ctx, { ignoreUserDefinedContent: true }).toString();
  const conclusion = displayConclusion(ctx).toString();
  yield {
    edited: isDefined(ctx.userDefinedBlocks.conclusion) && !readsTheSame(conclusion, generatedConclusion),
    generatedHtml: generatedConclusion,
    html: conclusion,
    kind: 'conclusion',
    outdated: Boolean(ctx.userDefinedBlocks.conclusion?.isOutdated),
    weight: 1e6,
  };
}
