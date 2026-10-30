import { load } from 'cheerio';

import { DateOnly } from '../../../../../../utils/date-only';
import { makeId } from '../../../../../../utils/id';
import { OfficialReportChairman } from '../../../domain/official-report-chairman';
import { OfficialReportMember } from '../../../domain/official-report-member';
import { OfficialReportMembersList } from '../../../domain/official-report-member-list';
import { OfficialReportSecretary } from '../../../domain/official-report-secretary';
import { OfficialReportSessionMeeting } from '../../../domain/official-report-session-meeting';

import {
  officialReportBlocks,
  OfficialReportRenderContext,
  officialReportTemplate,
} from './official-report.html';

describe('officialReportTemplate', () => {
  const baseContext = {
    session: { id: makeId('SessionId'), date: DateOnly.fromJson({ day: 22, month: 6, year: 2026 }) },
    agenda: {
      date: DateOnly.fromJson({ day: 1, month: 7, year: 2026 }),
      formation: 'SIEGE',
      id: makeId('AgendaId'),
      propositionCount: 5,
    },

    hasRenouncement: true,
    justiceDepartmentContact: 'MME Marie CURIE, représentante de la DSJ',
    sessionMeeting: OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ day: 1, month: 7, year: 2026 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    }),

    secretary: OfficialReportSecretary.from({
      id: 's1',
      duty: 'SECRETARY',
      role: 'ADJOINT_SECRETAIRE_GENERAL',
      gender: 'FEMALE',
      displayTitle: null,
      title: 'FIRST_SECRETARY',
      firstName: 'ada',
      lastName: 'lovelace',
    }),
    chairman: OfficialReportChairman.from({
      id: 'm1',
      firstName: 'irène',
      lastName: 'joliot-curie',
      displayTitle: 'co-fondatrice du réseau Action PTT',
      gender: 'FEMALE',
      title: 'PRESIDENT_SIEGE',
      sort: 0,
      duty: 'PRESIDENT',
      expectedFormation: 'SIEGE',
      role: 'MEMBRE_DU_SIEGE',
    }),
    members: OfficialReportMembersList.from([
      OfficialReportMember.from({
        id: 'm2',
        sort: 1,
        firstName: 'marguerite',
        lastName: 'perey',
        displayTitle: 'conservatrice du musée du Jeu de Paume',
        gender: 'FEMALE',
        isAbsent: false,
        duty: null,
        title: null,
        expectedFormation: 'SIEGE',
        role: 'MEMBRE_DU_SIEGE',
      }),
      OfficialReportMember.from({
        id: 'm3',
        sort: 2,
        firstName: 'sophie',
        lastName: 'germain',
        displayTitle: null,
        gender: 'FEMALE',
        isAbsent: false,
        duty: null,
        title: null,
        expectedFormation: 'SIEGE',
        role: 'MEMBRE_DU_SIEGE',
      }),
    ]),

    files: [
      {
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'Appel de Lyon",
        id: 0n,
        name: 'MME Françoise BARRÉ-SINOUSSI',
        nominationFileId: makeId('NominationFileId', 'nf-0'),
        note: null,
        number: 100_0,
        outcome: 'VALIDATED',
        reporters: ['MME Marguerite PEREY'],
        targetedGrade: 'G3',
        targetedPosition: `présidente à la cour d'appel de Grenoble`,
      },
      {
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'Appel de Amiens",
        id: 1n,
        name: 'MME Jacqueline FERRAND',
        nominationFileId: makeId('NominationFileId', 'nf-1'),
        note: null,
        number: 100_1,
        outcome: 'NON_VALIDATED',
        reporters: ['MME Sophie GERMAIN'],
        targetedGrade: 'G3',
        targetedPosition: `présidente à la cour d'appel de Reims`,
      },
      {
        currentGrade: 'G3',
        currentPosition: "président à la cour d'Appel de Valence",
        id: 2n,
        name: 'MME Barbara McCLINTOCK',
        nominationFileId: makeId('NominationFileId', 'nf-2'),
        note: null,
        number: 100_2,
        outcome: 'NON_VALIDATED',
        reporters: ['MME Marguerite PEREY'],
        targetedGrade: 'G3',
        targetedPosition: `président à la cour d'appel de Riom`,
      },
      {
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'Appel de Lille",
        id: 3n,
        name: 'MME Marthe GAUTIER',
        nominationFileId: makeId('NominationFileId', 'nf-3'),
        note: null,
        number: 100_3,
        outcome: 'SUSPENDED',
        reporters: ['MME Irène JOLIOT-CURIE'],
        targetedGrade: 'G3',
        targetedPosition: `présidente à la cour d'appel de Marseille`,
      },
      {
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'Appel de Strasbourg",
        id: 4n,
        name: 'MME Marthe GAUTIER',
        nominationFileId: makeId('NominationFileId', 'nf-4'),
        note: null,
        number: 100_4,
        outcome: 'WITHDRAWN',
        reporters: ['MME Sophie GERMAIN'],
        targetedGrade: 'G3',
        targetedPosition: `présidente à la cour d'appel de Dijon`,
      },
    ],

    agendaProposals: new Map<
      string,
      { at: Date | null; by: { id: string; name: string } | null; html: string }
    >(),
    fileAgendas: new Map<string, string>(),

    userDefinedBlocks: {
      files: {},
      outcomes: {},
      intro: undefined,
      conclusion: undefined,
    },
  } as const satisfies OfficialReportRenderContext;

  it('should render', () => {
    const $ = load(officialReportTemplate.render(baseContext));
    expect($('main').html()).toMatchSnapshot();
  });

  it('reads a name written in HTML as text', () => {
    const name = '<img src=x onerror=alert(1)>';
    const $ = load(
      officialReportTemplate.render({
        ...baseContext,
        files: baseContext.files.map((file) => ({ ...file, name })),
      }),
    );

    expect($('main img')).toHaveLength(0);
    expect($('main ol strong').first().text()).toBe(name);
  });

  it('should not display the renouncement when false', () => {
    const $ = load(officialReportTemplate.render({ ...baseContext, hasRenouncement: false }));

    expect($('main').html()).not.toContain(`indique renoncer au délai de convocation`);
  });

  it('should speak of a single proposition when the agenda holds only one', () => {
    const $ = load(
      officialReportTemplate.render({
        ...baseContext,
        agenda: { ...baseContext.agenda, propositionCount: 1 },
      }),
    );

    expect($('main').text()).toContain(`de l'avis émis par le Conseil sur la proposition figurant`);
  });

  it('should include non president members in end-time', () => {
    const c = baseContext.chairman;
    const chairman = new OfficialReportChairman(
      c.id,
      c.firstName,
      c.lastName,
      c.gender,
      null, // displayTitle
      null, // title
    );

    const $ = load(
      officialReportTemplate.render({
        ...baseContext,
        chairman,
      }),
    );

    expect($('.end-time').html()).toMatchSnapshot();
  });

  it('prefer the user defined version of a paragraph', () => {
    const $ = load(
      officialReportTemplate.render({
        ...baseContext,
        userDefinedBlocks: {
          ...baseContext.userDefinedBlocks,
          files: {
            [makeId('NominationFileId', 'nf-4')]: {
              html: /* html */ `<p><strong>MME Marthe GAUTIER</strong>, a vu son paragraphe subir une modification</p>`,
              isOutdated: false,
              editedAt: null,
              editedBy: null,
              fromAgenda: false,
            },
          },
        },
      }),
    );

    const html = $.html();
    expect(html).not.toContain(
      /* html */ `<strong>MME Marthe GAUTIER</strong>, actuellement présidente à la cour d'Appel de Strasbourg (G3)`,
    );
    expect(html).toContain(
      /* html */ `<strong>MME Marthe GAUTIER</strong>, a vu son paragraphe subir une modification`,
    );
  });

  it('should write the note under the paragraph of its proposition', () => {
    const note = { editedAt: null, editedBy: null, html: '<p>Une information propre au PV</p>' };
    const $ = load(
      officialReportTemplate.render({
        ...baseContext,
        files: baseContext.files.map((file, index) => ({ ...file, note: index === 0 ? note : null })),
      }),
    );

    expect($('main ol li:contains("BARRÉ-SINOUSSI")').html()).toContain(
      /* html */ `au rapport de MME Marguerite PEREY.<p>Une information propre au PV</p>`,
    );
    expect($('main ol p:contains("Une information propre au PV")')).toHaveLength(1);
  });

  it('should not credit the reader for a block reading as the report proposes', () => {
    const [file] = baseContext.files;
    const proposed = Array.from(officialReportBlocks(baseContext)).find(
      (block) => block.kind === 'file' && block.nominationFileId === file.nominationFileId,
    );
    if (proposed?.kind !== 'file') throw new Error(`${file.nominationFileId} has no block`);

    const blocks = Array.from(
      officialReportBlocks({
        ...baseContext,
        userDefinedBlocks: {
          ...baseContext.userDefinedBlocks,
          files: {
            [file.nominationFileId!]: {
              // the editor gives the text back wrapped and spaced its own way
              html: `<p>${proposed.html}</p>`,
              isOutdated: false,
              editedAt: new Date('2026-09-21T08:18:00Z'),
              editedBy: null,
              fromAgenda: true,
            },
          },
        },
      }),
    );

    const stored = blocks.find(
      (block) => block.kind === 'file' && block.nominationFileId === file.nominationFileId,
    );

    expect(stored).toMatchObject({ edited: false, editedAt: null, fromAgenda: false });
  });

  it('should credit the reader for a section written by hand', () => {
    const blocks = Array.from(
      officialReportBlocks({
        ...baseContext,
        userDefinedBlocks: {
          ...baseContext.userDefinedBlocks,
          outcomes: {
            WITHDRAWN: {
              intro: { html: '<p>Une section écrite à la main</p>', isOutdated: false },
              title: { html: 'Un titre écrit à la main', isOutdated: false },
            },
          },
        },
      }),
    );

    const withdrawn = blocks.filter(
      (block) =>
        (block.kind === 'section-title' || block.kind === 'section-intro') && block.outcome === 'WITHDRAWN',
    );
    expect(withdrawn).toMatchObject([{ edited: true }, { edited: true }]);
  });

  it('should order files', () => {
    const blocks = Array.from(
      officialReportBlocks({
        ...baseContext,
        files: [1, 2, 0].map((x) => ({ ...baseContext.files[x]!, outcome: 'VALIDATED' })),
      }),
    );

    expect(
      blocks.filter((block) => block.kind === 'file').map(({ nominationFileId }) => nominationFileId),
    ).toEqual([
      baseContext.files[0].nominationFileId,
      baseContext.files[1].nominationFileId,
      baseContext.files[2].nominationFileId,
    ]);
  });
});
