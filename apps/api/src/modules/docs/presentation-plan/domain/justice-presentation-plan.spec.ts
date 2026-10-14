import {
  JusticePresentationPlan,
  JusticePresentationPlanAgendaRemoved,
  JusticePresentationPlanAlreadyValidated,
  JusticePresentationPlanDeleted,
} from './justice-presentation-plan';
import { JusticePresentationPlanContent } from './justice-presentation-plan-content';

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
});

function aDraft(props: { agendaIds: readonly string[]; isValidated?: boolean }) {
  return JusticePresentationPlan.from({
    agendaIds: props.agendaIds,
    content: JusticePresentationPlanContent.from([]),
    formation: 'SIEGE',
    id: 'plan-1',
    isPresented: false,
    isValidated: props.isValidated ?? false,
    outdated: false,
    startTime: { hours: 9, minutes: 0, seconds: 0 },
  });
}
