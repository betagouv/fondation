import { load } from 'cheerio';

import { Gender, Magistrat } from 'shared-models';

import { DateOnly } from 'src/utils/date-only';

import { officialReportTemplate } from './official-report.html';

describe('officialReportTemplate', () => {
  const baseSession = {
    agendaDate: DateOnly.fromJson({ day: 1, month: 7, year: 2026 }),
    formation: Magistrat.Formation.SIEGE,
    hasRenouncement: true,
    justiceDepartmentContact: 'MME Lucie AUBRAC, représentante de la DSJ',
    chairman: {
      id: 'm1',
      firstName: 'simone',
      lastName: 'michel-levy',
      displayTitle: 'co-fondatrice du réseau Action PTT',
      gender: Gender.F,
      title: 'PRESIDENT_SIEGE',
    },
    members: [
      {
        id: 'm2',
        sort: 1,
        firstName: 'rose',
        lastName: 'valland',
        displayTitle: 'conservatrice du musée du Jeu de Paume',
        gender: Gender.F,
        isAbsent: false,
      },
      {
        id: 'm3',
        sort: 2,
        firstName: 'germaine',
        lastName: 'tillon',
        displayTitle: null,
        gender: Gender.F,
        isAbsent: false,
      },
    ],
    secretary: {
      gender: Gender.F,
      displayTitle: null,
      title: 'FIRST_SECRETARY',
      id: 's1',
      firstName: 'catherine',
      lastName: 'dior',
    },
    sessionDate: DateOnly.fromJson({ day: 22, month: 6, year: 2026 }),
    sessionMeetingDate: DateOnly.fromJson({ day: 1, month: 7, year: 2026 }),
    sessionMeetingTime: { hours: 18, minutes: 0 },
    sessionMeetingEndTime: { hours: 18, minutes: 10 },
    files: [
      {
        name: 'MME Simonne Mathieu',
        currentGrade: Magistrat.Grade.G3,
        currentPosition: "présidente à la cour d'Appel de Lyon",
        reporters: ['MME Rose VALLAND'],
        targetedGrade: Magistrat.Grade.G3,
        targetedPosition: `présidente à la cour d'appel de Grenoble`,
        outcome: 'VALIDATED',
      },
      {
        name: 'MME Marcelle Henry',
        currentGrade: Magistrat.Grade.G3,
        currentPosition: "présidente à la cour d'Appel de Amiens",
        reporters: ['MME Germaine TILLON'],
        targetedGrade: Magistrat.Grade.G3,
        targetedPosition: `présidente à la cour d'appel de Reims`,
        outcome: 'NON_VALIDATED',
      },
      {
        name: 'M. Léon BLUM',
        currentGrade: Magistrat.Grade.G3,
        currentPosition: "président à la cour d'Appel de Valence",
        reporters: ['MME Rose VALLAND'],
        targetedGrade: Magistrat.Grade.G3,
        targetedPosition: `président à la cour d'appel de Riom`,
        outcome: 'NON_VALIDATED',
      },
      {
        name: 'MME Mélinée MANOUCHIAN',
        currentGrade: Magistrat.Grade.G3,
        currentPosition: "présidente à la cour d'Appel de Lille",
        reporters: ['MME Simone MICHEL-LEVY'],
        targetedGrade: Magistrat.Grade.G3,
        targetedPosition: `présidente à la cour d'appel de Marseille`,
        outcome: 'SUSPENDED',
      },
      {
        name: 'MME Mélinée MANOUCHIAN',
        currentGrade: Magistrat.Grade.G3,
        currentPosition: "présidente à la cour d'Appel de Strasbourg",
        reporters: ['MME Germaine TILLON'],
        targetedGrade: Magistrat.Grade.G3,
        targetedPosition: `présidente à la cour d'appel de Dijon`,
        outcome: 'WITHDRAWN',
      },
    ],
  } as const;

  it('should render', () => {
    const $ = load(officialReportTemplate.render(baseSession));
    expect($('main').html()).toMatchSnapshot();
  });

  it('should not display the renouncement when false', () => {
    const $ = load(officialReportTemplate.render({ ...baseSession, hasRenouncement: false }));

    expect($('main').html()).not.toContain(`indique renonce au délai de convocation`);
  });

  it('should include non president members in end-time', () => {
    const $ = load(
      officialReportTemplate.render({
        ...baseSession,
        chairman: { ...baseSession.chairman, title: null, displayTitle: null },
      }),
    );

    expect($('.end-time').html()).toMatchSnapshot();
  });
});
