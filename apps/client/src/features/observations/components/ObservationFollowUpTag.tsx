import Tag from '@codegouvfr/react-dsfr/Tag';
import { useIntl } from 'react-intl';

import {
  ObservationFollowUpEnumMessages,
  type ObservationFollowUpEnum,
} from '@/shared/enums/observation-follow-up.enum';

const FOLLOW_UP_TAG_CLASS: Record<ObservationFollowUpEnum, string> = {
  ALERT: 'bg-(--background-contrast-error)! text-(--text-default-error)!',
  INTERESTING: 'bg-(--background-contrast-info)! text-(--text-default-info)!',
  REFERENCE: 'bg-(--background-contrast-success)! text-(--text-default-success)!',
};

export function ObservationFollowUpTag(props: { followUp: ObservationFollowUpEnum }) {
  const intl = useIntl();

  return (
    <Tag
      className={`min-h-5! rounded-sm! px-1.5! py-0.5! text-[0.625rem]! leading-none! font-semibold! uppercase ${FOLLOW_UP_TAG_CLASS[props.followUp]}`}
      small
    >
      {intl.formatMessage(ObservationFollowUpEnumMessages[props.followUp])}
    </Tag>
  );
}
