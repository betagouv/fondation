import { useAgenda } from '@/features/documents/context/AgendaContext';

import { AgendaMetadataForm } from './AgendaMetadataForm';

export function AgendaMetadataStep(props: { className?: string }) {
  const { submit, goToFiles, session, isSubmitting } = useAgenda();

  return (
    <AgendaMetadataForm
      className={props.className}
      formation={session.formation}
      isSubmitting={isSubmitting}
      submitLabel="Générer l'ordre du jour"
      cancelLabel="Retour"
      onCancel={goToFiles}
      onSubmit={submit}
    />
  );
}
