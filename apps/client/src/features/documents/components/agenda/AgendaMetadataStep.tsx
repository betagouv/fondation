import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { useAgenda } from '@/features/documents/context/AgendaContext';

import { AgendaMetadataForm } from './AgendaMetadataForm';

export function AgendaMetadataStep(props: { actionsSlot?: Element | null; className?: string }) {
  const { goToFiles, metadata, session } = useAgenda();

  return (
    <div
      className={clsx(
        'fr-py-8v mx-[calc(50%-50vw)] bg-(--background-alt-grey) px-[calc(50vw-50%)]',
        props.className,
      )}
    >
      <AgendaMetadataForm
        actionsSlot={props.actionsSlot}
        className="fr-p-6v bg-(--background-default-grey)"
        defaultValues={metadata}
        formation={session.formation}
        onSubmit={goToFiles}
        submitLabel={<FormattedMessage defaultMessage="Continuer" />}
      />
    </div>
  );
}
