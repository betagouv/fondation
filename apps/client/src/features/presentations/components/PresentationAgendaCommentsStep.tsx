import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import Alert from '@codegouvfr/react-dsfr/Alert';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { usePresentationPlan } from '@/features/presentations/context/presentation-plan.context';
import { useListPresentationPlansAgendasQuery } from '@queries/agenda.queries';

export function PresentationAgendaCommentsStep(props: { className?: string }) {
  const { formatMessage } = useIntl();
  const { state, createPlan, hasFailed, hasAllMandatoryMetadata, isDisabled, planId, goToMetadata } =
    usePresentationPlan();

  const { data: agendasData } = useListPresentationPlansAgendasQuery({
    ignorePlanId: planId ?? undefined,
  });

  const agendaIds = Object.keys(state.agendas);
  const agendas = useMemo(
    () => (agendasData?.items ?? []).filter(({ id }) => agendaIds.includes(id)),
    [agendasData, agendaIds],
  );

  const uniqueAgendas = useMemo(() => {
    const seenSessions = new Set<string>();
    return agendas.filter(({ session }) => {
      if (seenSessions.has(session.id)) return false;
      seenSessions.add(session.id);
      return true;
    });
  }, [agendas]);

  const [comments, setComments] = useState<Record<string, string>>(() =>
    Object.fromEntries(agendaIds.map((id) => [id, state.agendas[id] ?? ''])),
  );

  const onCommentChange = useCallback((agendaId: string, value: string) => {
    setComments((prev) => ({ ...prev, [agendaId]: value }));
  }, []);

  const onSubmit = useCallback(() => {
    createPlan({
      agendas: Object.fromEntries(
        Object.entries(comments).map(([id, comment]) => [id, comment.trim() || null]),
      ),
    });
  }, [comments, createPlan]);

  return (
    <div className={clsx('mx-auto max-w-2xl', props.className)}>
      {!hasAllMandatoryMetadata && (
        <Alert
          className="fr-mb-6v"
          description={
            <FormattedMessage defaultMessage="Les informations de la séance ont été perdues, probablement après un rechargement de la page. Revenez à l'étape précédente pour les saisir à nouveau." />
          }
          severity="warning"
          title={<FormattedMessage defaultMessage="Informations de la séance incomplètes" />}
        />
      )}

      {hasFailed && (
        <Alert
          className="fr-mb-6v"
          description={
            <FormattedMessage defaultMessage="Réessayez et prévenez le support si cela persiste." />
          }
          severity="error"
          title={<FormattedMessage defaultMessage="La création de la notice a échoué" />}
        />
      )}

      {uniqueAgendas.map((agenda, i) => (
        <Accordion defaultExpanded={i === 0} key={agenda.id} label={agenda.session.name}>
          <Input
            label={formatMessage({ defaultMessage: 'Commentaire' })}
            nativeTextAreaProps={{
              rows: 4,
              value: comments[agenda.id] ?? '',
              style: { fieldSizing: 'content' },
              onChange: (e) => onCommentChange(agenda.id, e.target.value),
            }}
            textArea
          />
        </Accordion>
      ))}

      <ButtonsGroup
        alignment="right"
        buttons={[
          {
            children: formatMessage({ defaultMessage: 'Retour' }),
            onClick: goToMetadata,
            priority: 'secondary',
            type: 'button',
          },
          {
            children: formatMessage({ defaultMessage: 'Créer la notice' }),
            type: 'button',
            onClick: onSubmit,
            disabled: isDisabled || !hasAllMandatoryMetadata,
          },
        ]}
        className="fr-mt-6v"
        inlineLayoutWhen="md and up"
      />
    </div>
  );
}
