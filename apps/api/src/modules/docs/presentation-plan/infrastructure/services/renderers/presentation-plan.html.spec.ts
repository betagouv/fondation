import { load } from 'cheerio';

import { DateOnly } from 'src/utils/date-only';

import {
  presentationPlanTemplate,
  updatePresentationTimeDocMeetingSessionEndingTime,
} from './presentation-plan.html';

const baseCtx = {
  date: DateOnly.fromJson({ day: 1, month: 7, year: 2026 }),
  formation: 'SIEGE',
  hasRenunciation: true,
  justiceContactName: 'MME Marie CURIE, représentante de la DSJ',
  secretary: {
    firstName: 'ada',
    lastName: 'lovelace',
  },
  time: { hours: 18, minutes: 0, seconds: 0 },
  typeDeSaisine: 'TRANSPARENCE_GDS',
  sessions: [
    {
      id: 'session-1',
      formation: 'SIEGE',
      name: `Transparence annuelle`,
      typeDeSaisine: 'TRANSPARENCE_GDS',
      agendas: [
        {
          chairman: {
            firstName: 'irène',
            lastName: 'joliot-curie',
          },
          comments: [
            `Le Conseil regrette de n'avoir été saisi que trop tard de la situation, ` +
              `particulièrement pour MME Barbara McCLINTOCK dont l'évaluation ne nous a pas été fournie.`,
          ],
          nominationFiles: [
            {
              name: 'MME Françoise BARRÉ-SINOUSSI',
              number: 1,
              agendaId: `a-1`,
              targetedGrade: 'G3',
              targetedPosition: `présidente à la cour d'appel de Grenoble`,
              outcome: 'VALIDATED',
              outcomeComment: null,
            },
            {
              name: 'MME Jacqueline FERRAND',
              targetedGrade: 'G3',
              targetedPosition: `présidente à la cour d'appel de Reims`,
              outcome: 'NON_VALIDATED',
              outcomeComment: `Sa dernière évaluation ne permet pas de confirmer sa proposition`,
              agendaId: `a-1`,
              number: 2,
            },
            {
              name: 'MME Barbara McCLINTOCK',
              number: 3,
              agendaId: `a-1`,
              outcomeComment: `Sans évaluation il n'est pas possible de confirmer la proposition`,
              targetedGrade: 'G3',
              targetedPosition: `président à la cour d'appel de Riom`,
              outcome: 'NON_VALIDATED',
            },
            {
              name: 'MME Marthe GAUTIER',
              targetedGrade: 'G3',
              targetedPosition: `présidente à la cour d'appel de Marseille`,
              outcome: 'SUSPENDED',
              number: 4,
              agendaId: 'a-1',
              outcomeComment: null,
            },
            {
              name: 'MME Marthe GAUTIER',
              number: 5,
              agendaId: 'a-1',
              outcomeComment: null,
              targetedGrade: 'G3',
              targetedPosition: `présidente à la cour d'appel de Dijon`,
              outcome: 'WITHDRAWN',
            },
          ],
        },
      ],
    },
  ],
} as const;

describe('presentationPlanTemplate', () => {
  it('should render', () => {
    const $ = load(presentationPlanTemplate.render(baseCtx));

    expect($('main').html()).toMatchSnapshot();
  });

  it('should add the end time', () => {
    const html = presentationPlanTemplate.render(baseCtx);
    const result = updatePresentationTimeDocMeetingSessionEndingTime({
      html,
      meetingSessionEndingTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    expect(result).toContain('Heure de fin de la séance de restitution&nbsp;: 18:10');
  });
});
