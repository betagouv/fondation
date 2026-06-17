import { load } from 'cheerio';

import { Gender, Magistrat } from 'shared-models';

import { agendaTemplate } from './agenda.html';

describe('agendaTemplate', () => {
  it('should render', () => {
    const content = agendaTemplate.render({
      chairman: { firstName: `léon`, lastName: 'blum', gender: Gender.M, title: 'PRESIDENT_SIEGE' },
      date: new Date('2026-07-01'),
      sessionMeetingDate: new Date('2026-07-01'),
      formation: Magistrat.Formation.SIEGE,
      nominationFiles: [
        {
          name: `MME Simone Veil`,
          currentGrade: Magistrat.Grade.G3,
          currentPosition: "présidente à la cour d'appel de Lyon",
          targetedPosition: "présidente à la cour d'appel de Grenoble",
          targetedGrade: Magistrat.Grade.G3,
          reporters: ['M. Michel FOUCAULT'],
        },
      ],
    });

    const $ = load(content);
    expect($('main').html()).toMatchSnapshot();
  });
});
