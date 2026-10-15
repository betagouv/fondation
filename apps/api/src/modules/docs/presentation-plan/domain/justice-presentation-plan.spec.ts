import { DateOnly } from 'src/utils/date-only';

import {
  JusticePresentationPlan,
  JusticePresentationPlanAgendaRemoved,
  JusticePresentationPlanAlreadyValidated,
  JusticePresentationPlanDeleted,
  JusticePresentationPlanUpdated,
  type UpdateJusticePresentationPlanCommand,
} from './justice-presentation-plan';
import { JusticePresentationPlanContent } from './justice-presentation-plan-content';
import { JusticePresentationPlanSettings } from './justice-presentation-plan-settings';

describe('JusticePresentationPlan', () => {
  describe('removeAgendas', () => {
    const removal = { removerId: 'user-1', takenByPlanId: 'plan-2' };

    it('should give up the agendas another notice takes', () => {
      const plan = aDraft({ agendaIds: ['agenda-1', 'agenda-2', 'agenda-3'] });

      plan.removeAgendas({ ...removal, agendaIds: ['agenda-1', 'agenda-3'] });

      expect(plan.messages).toEqual([
        new JusticePresentationPlanAgendaRemoved(plan.id, 'agenda-1', 'plan-2', 'user-1'),
        new JusticePresentationPlanAgendaRemoved(plan.id, 'agenda-3', 'plan-2', 'user-1'),
      ]);
    });

    it('should disappear once it has no agenda left', () => {
      const plan = aDraft({ agendaIds: ['agenda-1', 'agenda-2'] });

      plan.removeAgendas({ ...removal, agendaIds: ['agenda-1', 'agenda-2'] });

      expect(plan.messages).toEqual([new JusticePresentationPlanDeleted(plan.id)]);
    });

    it('should keep the agendas it does not share', () => {
      const plan = aDraft({ agendaIds: ['agenda-1'] });

      plan.removeAgendas({ ...removal, agendaIds: ['agenda-2'] });

      expect(plan.messages).toEqual([]);
    });

    it('should not give up the agendas of a validated notice', () => {
      const plan = aDraft({ agendaIds: ['agenda-1', 'agenda-2'], isValidated: true });

      expect(() => plan.removeAgendas({ ...removal, agendaIds: ['agenda-1'] })).toThrow(
        JusticePresentationPlanAlreadyValidated,
      );
    });
  });

  describe('update', () => {
    const chairman = aUser({ duty: 'PRESIDENT', id: 'chairman-1', title: 'PRESIDENT_SIEGE' });
    const secretary = aUser({ duty: 'SECRETARY', id: 'secretary-1', role: 'ADJOINT_SECRETAIRE_GENERAL' });
    const command: UpdateJusticePresentationPlanCommand = {
      agendas: [
        {
          comment: ' hors délai ',
          formation: 'SIEGE',
          id: 'agenda-1',
          presentationPlan: { id: 'plan-1' },
          session: { id: 'session-1', name: 'T1' },
        },
      ],
      authorId: 'user-1',
      chairman,
      date: new DateOnly(2026, 2, 10),
      hasRenunciation: true,
      justiceContactId: '12',
      members: [
        { id: 'chairman-1', isAbsent: false },
        { id: 'member-1', isAbsent: false },
        { id: 'member-2', isAbsent: true },
      ],
      secretary,
      time: { hours: 9, minutes: 30, seconds: 0 },
    };
    it('should stay as it is when saved unchanged', () => {
      const plan = aDraft({ agendaIds: ['agenda-1'], isValidated: true });

      plan.update(command);

      expect(plan.messages).toEqual([]);
    });

    it.each<[string, Partial<UpdateJusticePresentationPlanCommand>]>([
      [
        'an absence',
        {
          members: [
            { id: 'member-1', isAbsent: false },
            { id: 'member-2', isAbsent: false },
          ],
        },
      ],
      ['an agenda comment', { agendas: [{ ...command.agendas[0]!, comment: 'dans les délais' }] }],
      ['the date', { date: new DateOnly(2026, 2, 11) }],
      ['the time', { time: { hours: 10, minutes: 30, seconds: 0 } }],
    ])('should be written again when %s changes', (_, change) => {
      const plan = aDraft({ agendaIds: ['agenda-1'] });

      plan.update({ ...command, ...change });

      expect(plan.messages.map((m) => m.constructor)).toEqual([JusticePresentationPlanUpdated]);
    });

    it('should be written again when outdated, even unchanged', () => {
      const plan = aDraft({ agendaIds: ['agenda-1'], outdated: true });

      plan.update(command);

      expect(plan.messages.map((m) => m.constructor)).toEqual([JusticePresentationPlanUpdated]);
    });
  });
});

const STORED_SETTINGS = JusticePresentationPlanSettings.from({
  agendas: [{ comment: 'hors délai', id: 'agenda-1' }],
  chairmanId: 'chairman-1',
  date: new DateOnly(2026, 2, 10),
  hasRenunciation: true,
  justiceContactId: '12',
  members: [
    { id: 'member-1', isAbsent: false },
    { id: 'member-2', isAbsent: true },
  ],
  secretaryId: 'secretary-1',
  time: { hours: 9, minutes: 30, seconds: 0 },
});

function aDraft(props: { agendaIds: readonly string[]; isValidated?: boolean; outdated?: boolean }) {
  return JusticePresentationPlan.from({
    agendaIds: props.agendaIds,
    content: JusticePresentationPlanContent.from([]),
    formation: 'SIEGE',
    id: 'plan-1',
    isPresented: false,
    isValidated: props.isValidated ?? false,
    outdated: props.outdated ?? false,
    settings: STORED_SETTINGS,
    startTime: { hours: 9, minutes: 0, seconds: 0 },
  });
}

function aUser(
  props: Partial<UpdateJusticePresentationPlanCommand['chairman']>,
): UpdateJusticePresentationPlanCommand['chairman'] {
  return {
    displayTitle: null,
    duty: null,
    firstName: 'Jeanne',
    gender: 'FEMALE',
    id: 'user-1',
    lastName: 'Dupont',
    role: 'MEMBRE_DU_SIEGE',
    title: null,
    ...props,
  };
}
