import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import clsx from 'clsx';
import React from 'react';

import { usePresentationPlan } from '@/features/presentations/context/presentation-plan.context';
import { useListPresentationPlansAgendasQuery } from '@queries/agenda.queries';

export function PresentationAgendaCommentsStep(props: { className?: string }) {
  const { state, createPlan, isDisabled, planId, goToMetadata } = usePresentationPlan();

  const { data: agendasData } = useListPresentationPlansAgendasQuery({
    ignorePlanId: planId ?? undefined,
  });

  const agendaIds = Object.keys(state.agendas);
  const agendas = React.useMemo(
    () => (agendasData?.items ?? []).filter(({ id }) => agendaIds.includes(id)),
    [agendasData, agendaIds],
  );

  const uniqueAgendas = React.useMemo(() => {
    const seenSessions = new Set<string>();
    return agendas.filter(({ session }) => {
      if (seenSessions.has(session.id)) return false;
      seenSessions.add(session.id);
      return true;
    });
  }, [agendas]);

  const [comments, setComments] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(agendaIds.map((id) => [id, state.agendas[id] ?? ''])),
  );

  const onCommentChange = React.useCallback((agendaId: string, value: string) => {
    setComments((prev) => ({ ...prev, [agendaId]: value }));
  }, []);

  const onSubmit = React.useCallback(() => {
    createPlan({
      agendas: Object.fromEntries(
        Object.entries(comments).map(([id, comment]) => [id, comment.trim() || null]),
      ),
    });
  }, [comments, createPlan]);

  return (
    <div className={clsx('mx-auto max-w-2xl', props.className)}>
      {uniqueAgendas.map((agenda, i) => (
        <Accordion key={agenda.id} defaultExpanded={i === 0} label={agenda.session.name}>
          <Input
            label="Commentaire"
            textArea
            nativeTextAreaProps={{
              rows: 4,
              value: comments[agenda.id] ?? '',
              style: { fieldSizing: 'content' },
              onChange: (e) => onCommentChange(agenda.id, e.target.value),
            }}
          />
        </Accordion>
      ))}

      <ButtonsGroup
        className="fr-mt-6v"
        alignment="right"
        inlineLayoutWhen="md and up"
        buttons={[
          { children: 'Retour', priority: 'secondary', onClick: goToMetadata, type: 'button' },
          {
            children: 'Créer la notice',
            type: 'button',
            onClick: onSubmit,
            disabled: isDisabled,
          },
        ]}
      />
    </div>
  );
}
