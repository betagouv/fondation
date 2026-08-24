import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { AddNominationFileAttachmentModal } from '../AddNominationFileAttachmentModal';

import {
  AddNominationFileAttachmentModalContext,
  type AttachmentTarget,
} from './AddNominationFileAttachmentModalContext';

export function AddNominationFileAttachmentModalProvider(props: { children: ReactNode }) {
  const [target, setTarget] = useState<AttachmentTarget | null>(null);

  const open = useCallback((target: AttachmentTarget) => setTarget(target), []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <AddNominationFileAttachmentModalContext value={value}>
      <AddNominationFileAttachmentModal onClose={() => setTarget(null)} target={target} />
      {props.children}
    </AddNominationFileAttachmentModalContext>
  );
}
