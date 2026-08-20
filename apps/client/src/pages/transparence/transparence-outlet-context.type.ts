import type { DetailedNominationSessionDto } from '@api/types';

/** @warning the page resolves the session before rendering the outlet, so tabs never have to guard it */
export type TransparenceOutletContext = {
  filtersSlot: Element | null;
  transparence: DetailedNominationSessionDto;
};
