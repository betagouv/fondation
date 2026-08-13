import { useCallback, useMemo, useState, type ReactNode } from 'react';

import {
  addNominationFileAttachmentModal,
  AddNominationFileAttachmentModal,
} from '../AddNominationFileAttachmentModal';

import {
  AddNominationFileAttachmentModalContext,
  type AttachmentTarget,
} from './AddNominationFileAttachmentModalContext';

export function AddNominationFileAttachmentModalProvider(props: { children: ReactNode }) {
  const [target, setTarget] = useState<AttachmentTarget | null>(null);

  const open = useCallback((target: AttachmentTarget) => {
    setTarget(target);
    addNominationFileAttachmentModal.open();
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <AddNominationFileAttachmentModalContext value={value}>
      <AddNominationFileAttachmentModal target={target} />

      {props.children}
    </AddNominationFileAttachmentModalContext>
  );
}
