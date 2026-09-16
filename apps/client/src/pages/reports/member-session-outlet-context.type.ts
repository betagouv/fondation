import type { DetailedNominationSessionDto } from '@api/types';

/** @warning the layout resolves the session before rendering the outlet, so tabs never have to guard it */
export type MemberSessionOutletContext = {
  filtersSlot: Element | null;
  isPinned: boolean;
  session: DetailedNominationSessionDto;
  toolbarSlot: Element | null;
};
