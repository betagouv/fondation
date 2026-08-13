import { useIntl } from 'react-intl';

import type { NominationFileAttachmentTypeEnum } from '@/types/enums.types';
import { assertNever } from '@/utils/types.util';

export const NOMINATION_FILE_ATTACHMENT_TYPES = [
  'FICHE_DE_JURIDICTION',
  'NOTE_INTENTION',
  'AUTRE',
] as const satisfies readonly NominationFileAttachmentTypeEnum[];

export function useNominationFileAttachmentTypeLabel() {
  const { formatMessage } = useIntl();

  return (type: NominationFileAttachmentTypeEnum): string => {
    switch (type) {
      case 'FICHE_DE_JURIDICTION':
        return formatMessage({ defaultMessage: 'Fiche de juridiction' });
      case 'NOTE_INTENTION':
        return formatMessage({ defaultMessage: "Note d'intention" });
      case 'AUTRE':
        return formatMessage({ defaultMessage: 'Autre' });
      default:
        return assertNever(type);
    }
  };
}
