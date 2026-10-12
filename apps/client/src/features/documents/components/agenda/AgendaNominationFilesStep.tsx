import { FormattedMessage } from 'react-intl';

import { useAgenda } from '@/features/documents/context/AgendaContext';

import { AgendaFilesSelectionTable } from './AgendaFilesSelectionTable';

export function AgendaNominationFilesStep(props: {
  actionsSlot?: Element | null;
  className?: string;
  scrollsWithPage?: boolean;
}) {
  const { goToMetadata, isSubmitting, session, submit } = useAgenda();

  return (
    <AgendaFilesSelectionTable
      actionsSlot={props.actionsSlot}
      cancelLabel={<FormattedMessage defaultMessage="Retour" />}
      className={props.className}
      formation={session.formation}
      isSubmitting={isSubmitting}
      onCancel={goToMetadata}
      onSubmit={submit}
      outcomes={session.outcomes}
      renderSubmitLabel={(count) => (
        <FormattedMessage
          defaultMessage={`{count, plural,
            =0 {En attente de sélection}
            other {Générer l'ordre du jour}}`}
          values={{ count }}
        />
      )}
      scrollsWithPage={props.scrollsWithPage}
      sessionId={session.id}
    />
  );
}
