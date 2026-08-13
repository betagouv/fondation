import { colors } from '@codegouvfr/react-dsfr';
import Tag from '@codegouvfr/react-dsfr/Tag';

import type { NominationFileAttachmentTypeEnum } from '@/types/enums.types';
import { assertNever } from '@/utils/types.util';

import { useNominationFileAttachmentTypeLabel } from './nomination-file-attachment-type';

function tagColors(type: NominationFileAttachmentTypeEnum) {
  switch (type) {
    case 'FICHE_DE_JURIDICTION':
      return {
        background: colors.decisions.background.contrast.blueEcume.default,
        color: colors.decisions.text.label.blueEcume.default,
      };
    case 'NOTE_INTENTION':
      return {
        background: colors.decisions.background.contrast.greenEmeraude.default,
        color: colors.decisions.text.label.greenEmeraude.default,
      };
    case 'AUTRE':
      return {
        background: colors.decisions.background.contrast.grey.default,
        color: colors.decisions.text.label.grey.default,
      };
    default:
      return assertNever(type);
  }
}

export function NominationFileAttachmentTypeTag(props: { type: NominationFileAttachmentTypeEnum }) {
  const label = useNominationFileAttachmentTypeLabel();

  return (
    <Tag as="span" small style={tagColors(props.type)}>
      {label(props.type)}
    </Tag>
  );
}
