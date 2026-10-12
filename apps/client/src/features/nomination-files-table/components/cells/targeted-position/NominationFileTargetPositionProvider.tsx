import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { NominationFileTargetPositionContext } from './NominationFileTargetPositionContext';
import { NominationFileTargetPositionModal } from './NominationFileTargetPositionModal';

type TargetPositionState =
  | { nominationFile: SessionNominationFile; status: 'closing' }
  | { nominationFile: SessionNominationFile; status: 'open' }
  | { status: 'idle' };

export function NominationFileTargetPositionProvider(props: PropsWithChildren<{ sessionId: string }>) {
  const [state, setState] = useState<TargetPositionState>({ status: 'idle' });

  const open = useCallback(
    (nominationFile: SessionNominationFile) => setState({ nominationFile, status: 'open' }),
    [],
  );

  const close = useCallback(
    () =>
      setState((current) =>
        current.status === 'open' ? { nominationFile: current.nominationFile, status: 'closing' } : current,
      ),
    [],
  );

  const value = useMemo(() => ({ open }), [open]);

  return (
    <NominationFileTargetPositionContext value={value}>
      {state.status !== 'idle' && (
        <NominationFileTargetPositionModal
          key={state.nominationFile.id}
          nominationFile={state.nominationFile}
          onClose={close}
          onClosed={() =>
            setState((current) => (current.status === 'closing' ? { status: 'idle' } : current))
          }
          open={state.status === 'open'}
          sessionId={props.sessionId}
        />
      )}

      {props.children}
    </NominationFileTargetPositionContext>
  );
}
