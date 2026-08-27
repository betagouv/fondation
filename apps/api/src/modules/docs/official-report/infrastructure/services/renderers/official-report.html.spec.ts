import { load } from 'cheerio';

import { OfficialReportChairman } from 'src/modules/docs/official-report/domain/official-report-chairman';
import { OfficialReportMember } from 'src/modules/docs/official-report/domain/official-report-member';
import { OfficialReportMembersList } from 'src/modules/docs/official-report/domain/official-report-member-list';
import { OfficialReportSecretary } from 'src/modules/docs/official-report/domain/official-report-secretary';
import { OfficialReportSessionMeeting } from 'src/modules/docs/official-report/domain/official-report-session-meeting';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';

import {
  officialReportBlocks,
  OfficialReportRenderContext,
  officialReportTemplate,
} from './official-report.html';

describe('officialReportTemplate', () => {
  const baseContext = {
    session: { id: makeId('SessionId'), date: DateOnly.fromJson({ day: 22, month: 6, year: 2026 }) },
    agenda: {
      id: makeId('AgendaId'),
      date: DateOnly.fromJson({ day: 1, month: 7, year: 2026 }),
      formation: 'SIEGE',
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
        id: 0n,
        number: 100_0,
        nominationFileId: makeId('NominationFileId', 'nf-0'),
        name: 'MME Françoise BARRÉ-SINOUSSI',
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'Appel de Lyon",
        reporters: ['MME Marguerite PEREY'],
        targetedGrade: 'G3',
        targetedPosition: `présidente à la cour d'appel de Grenoble`,
        outcome: 'VALIDATED',
      },
      {
        id: 1n,
        number: 100_1,
        nominationFileId: makeId('NominationFileId', 'nf-1'),
        name: 'MME Jacqueline FERRAND',
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'Appel de Amiens",
        reporters: ['MME Sophie GERMAIN'],
        targetedGrade: 'G3',
        targetedPosition: `présidente à la cour d'appel de Reims`,
        outcome: 'NON_VALIDATED',
      },
      {
        id: 2n,
        number: 100_2,
        nominationFileId: makeId('NominationFileId', 'nf-2'),
        name: 'MME Barbara McCLINTOCK',
        currentGrade: 'G3',
        currentPosition: "président à la cour d'Appel de Valence",
        reporters: ['MME Marguerite PEREY'],
        targetedGrade: 'G3',
        targetedPosition: `président à la cour d'appel de Riom`,
        outcome: 'NON_VALIDATED',
      },
      {
        id: 3n,
        number: 100_3,
        nominationFileId: makeId('NominationFileId', 'nf-3'),
        name: 'MME Marthe GAUTIER',
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'Appel de Lille",
        reporters: ['MME Irène JOLIOT-CURIE'],
        targetedGrade: 'G3',
        targetedPosition: `présidente à la cour d'appel de Marseille`,
        outcome: 'SUSPENDED',
      },
      {
        id: 4n,
        number: 100_4,
        nominationFileId: makeId('NominationFileId', 'nf-4'),
        name: 'MME Marthe GAUTIER',
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'Appel de Strasbourg",
        reporters: ['MME Sophie GERMAIN'],
        targetedGrade: 'G3',
        targetedPosition: `présidente à la cour d'appel de Dijon`,
        outcome: 'WITHDRAWN',
      },
    ],

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

  it('should not display the renouncement when false', () => {
    const $ = load(officialReportTemplate.render({ ...baseContext, hasRenouncement: false }));

    expect($('main').html()).not.toContain(`indique renoncer au délai de convocation`);
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
