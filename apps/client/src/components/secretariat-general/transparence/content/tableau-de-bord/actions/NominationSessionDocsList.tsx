import clsx from 'clsx';
import React from 'react';

import { useFindSessionDocsQuery } from '@queries/agenda.queries';

import { DocActionDelete } from './DocActionDelete';
import { DocActionDetails } from './DocActionDetails';
import { DocActionUpdate } from './DocActionUpdate';

export function NominationSessionDocsList(props: { sessionId: string }) {
  const [currentlyActing, setCurrentlyActing] = React.useState<Record<string, boolean>>({});

  const isActing = React.useMemo(() => Object.values(currentlyActing).some((x) => x), [currentlyActing]);
  const setIsActing = React.useCallback(
    (id: string) => (isActing: boolean) => setCurrentlyActing((s) => ({ ...s, [id]: isActing })),
    [setCurrentlyActing],
  );

  const { data: docs } = useFindSessionDocsQuery({ sessionId: props.sessionId });

  if (!docs?.items?.length) return null;

  return (
    <ul className={clsx('m-0 flex flex-col gap-2 p-0')}>
      {docs.items.map((doc) => (
        <li key={doc.id} className="flex items-center gap-4 pb-0">
          <DocActionDetails
            disabled={isActing}
            sessionId={props.sessionId}
            doc={doc}
            setIsActing={setIsActing('details')}
          />

          <ul className="m-0 flex list-none items-center gap-2 p-0">
            <li>
              <DocActionUpdate
                disabled={isActing}
                doc={doc}
                sessionId={props.sessionId}
                setIsActing={setIsActing('update')}
              />
            </li>
            <li>
              <DocActionDelete doc={doc} disabled={isActing} sessionId={props.sessionId} />
            </li>
          </ul>
        </li>
      ))}
    </ul>
  );
}
