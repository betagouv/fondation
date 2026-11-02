import { createContext, useContext } from 'react';

import type { RemarkStatusEnum } from '@/shared/enums/remark-status.enum';

export type RemarkStatusCommentEvent = { type: 'drop' } | { type: 'comment'; value: string | null };

type RemarkStatusCommentModalContextType = {
  waitForStatusComment: (
    status: RemarkStatusEnum,
    comment: string | null,
  ) => Promise<RemarkStatusCommentEvent>;
};

/** @internal */
export const RemarkStatusCommentModalContext = createContext<RemarkStatusCommentModalContextType | null>(
  null,
);

export function useRemarkStatusCommentModal() {
  const context = useContext(RemarkStatusCommentModalContext);
  if (!context)
    throw new Error('useRemarkStatusCommentModal must be used within RemarkStatusCommentModalProvider');

  return context;
}
