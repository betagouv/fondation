import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { generatePath } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { useTab } from '@/hooks/useTab';
import {
  useDeleteAgenda,
  useDetailsSessionDocMutation,
  useFindSessionDocsQuery
} from '@queries/agenda.queries';
import React from 'react';

export function NominationSessionDocsList(props: { sessionId: string }) {
  const tab = useTab();
  const confirmation = useConfirmation();
  const { data: docs } = useFindSessionDocsQuery({ sessionId: props.sessionId });
  const { mutate: openDoc, isPending } = useDetailsSessionDocMutation();
  const { mutate: deleteAgenda, isPending: isDeleting } = useDeleteAgenda(props.sessionId);

  const onDeleteDoc = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      const docId = e.currentTarget.dataset.docId;
      if (!docId) return;

      const doc = (docs?.items ?? []).find((doc) => doc.id === docId);
      if (!doc) return;

      const { isConfirmed } = await confirmation.waitForConfirmation({
        title: `Confirmer la suppression de "${doc.name}"`,
        content: `Voulez-vous vraiment supprimer le document "${doc.name}"\u00A0?`
      });

      if (!isConfirmed) return;
      deleteAgenda({ agendaId: doc.id });
    },
    [confirmation, docs, deleteAgenda]
  );

  if (!docs?.items?.length) return null;

  return (
    <ul className={clsx('m-0 flex flex-col gap-2 p-0')}>
      {docs.items.map((doc) => (
        <li key={doc.id} className="flex items-center gap-4 pb-0">
          <Button
            size="small"
            priority="tertiary no outline"
            className="flex-grow truncate text-left"
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
          <ul className="m-0 flex list-none items-center gap-2 p-0">
            <li>
              <Button
                size="small"
                iconId="fr-icon-edit-fill"
                priority="tertiary no outline"
                className="rounded-full"
                title={`Modifier"{doc.name}"`}
                disabled={(isPending || isDeleting) as never}
                linkProps={
                  (isPending || isDeleting
                    ? undefined
                    : {
                        to: generatePath(ROUTE_PATHS.SG.UPDATE_AGENDA, {
                          sessionId: props.sessionId,
                          agendaId: doc.id
                        })
                      }) as never
                }
              />
            </li>
            <li>
              <Button
                size="small"
                iconId="fr-icon-delete-bin-fill"
                priority="tertiary no outline"
                className="rounded-full"
                disabled={isPending || isDeleting}
                title={`Supprimer "{doc.name}"`}
                nativeButtonProps={{ ...confirmation.buttonProps, ['data-doc-id']: doc.id }}
                onClick={onDeleteDoc}
              />
            </li>
          </ul>
        </li>
      ))}
    </ul>
  );
}
