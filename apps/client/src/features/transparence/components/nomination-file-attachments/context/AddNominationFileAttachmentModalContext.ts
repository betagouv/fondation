import { createContext, useContext } from 'react';

export type AttachmentTarget = { nominationFileId: string; sessionId: string };

type AddNominationFileAttachmentModalContextType = {
  open: (target: AttachmentTarget) => void;
};

/** @internal */
export const AddNominationFileAttachmentModalContext =
  createContext<AddNominationFileAttachmentModalContextType | null>(null);

export function useAddNominationFileAttachmentModal() {
  const ctx = useContext(AddNominationFileAttachmentModalContext);
  if (!ctx)
    throw new Error(
      'useAddNominationFileAttachmentModal must be used within AddNominationFileAttachmentModalProvider',
    );

  return ctx;
}
