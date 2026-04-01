import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';

import { useTab } from '@/hooks/useTab';
import { useDetailsSessionDocMutation, useFindSessionDocsQuery } from '@queries/agenda.queries';

export function NominationSessionDocsList(props: { sessionId: string }) {
  const tab = useTab();
  const { data: docs } = useFindSessionDocsQuery({ sessionId: props.sessionId });
  const { mutate: openDoc, isPending } = useDetailsSessionDocMutation();

  if (!docs?.items?.length) return null;

  return (
    <ul className={clsx('m-0 flex flex-col gap-2 p-0')}>
      {docs.items.map((doc) => (
        <li key={doc.id} className="flex items-center gap-4 pb-0">
          <Button
            priority="tertiary no outline"
            className="flex-grow text-ellipsis text-left"
            disabled={isPending}
            onClick={() =>
              openDoc(
                { sessionId: props.sessionId, agendaId: doc.id },
                { onSuccess: ({ url }) => tab.open(url) }
              )
            }
          >
            {doc.name}
          </Button>
        </li>
      ))}
    </ul>
  );
}
