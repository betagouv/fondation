import { FormattedMessage } from 'react-intl';

import { useAgenda } from '@/features/agenda/context/AgendaContext';
import { useAgendaBasket } from '@/features/agenda/hooks/useAgendaBasket.hook';

import { AgendaFilesSelection } from './AgendaFilesSelection';

export function AgendaNominationFilesStep(props: { className?: string }) {
  const { session, cancel, goToMetadata } = useAgenda();
  const basket = useAgendaBasket(session.id);

  return (
    <AgendaFilesSelection
      className={props.className}
      sessionId={session.id}
      formation={session.formation}
      defaultSelectedFileIds={basket.fileIds.length > 0 ? basket.fileIds : null}
      onCancel={cancel}
      onSubmit={goToMetadata}
      renderSubmitLabel={(count) => (
        <FormattedMessage
          values={{ count }}
          defaultMessage={`{count, plural,
            =0 {En attente de sélection}
            other {Définir les données de l'ODJ}}`}
        />
      )}
    />
  );
}
