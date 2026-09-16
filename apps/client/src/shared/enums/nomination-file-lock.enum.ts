import { defineMessages } from 'react-intl';

import type { PaginatedNominationFiles } from '@api/types';

export type NominationFileLockEnum = NonNullable<
  PaginatedNominationFiles['items'][number]['content']['lockedReason']
>;

export const NominationFileLockEnum = {
  ARCHIVED_SESSION: 'ARCHIVED_SESSION',
  REPORTED: 'REPORTED',
} as const satisfies Record<NominationFileLockEnum, NominationFileLockEnum>;

export const NominationFileLockEnumMessages = defineMessages({
  ARCHIVED_SESSION: { defaultMessage: "Session archivée : ce dossier n'est plus modifiable" },
  REPORTED: {
    defaultMessage:
      'Cette proposition est déjà actée dans un procès-verbal restitué et avec une issue définitive',
  },
} satisfies Record<NominationFileLockEnum, { defaultMessage: string }>);
