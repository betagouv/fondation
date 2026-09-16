import { FormattedMessage } from 'react-intl';

import { NominationFileLockEnumMessages } from '@/shared/enums/nomination-file-lock.enum';
import { AlertBanner } from '@/shared/ui/alert-banner';
import type { SessionNominationFileLockedReason } from '@queries/nomination-sessions.queries';

const BANNER_LAYOUT = '-mx-8 px-8 py-4';

export function FrozenFileBanner(props: { lockedReason: NonNullable<SessionNominationFileLockedReason> }) {
  return (
    <AlertBanner
      align="center"
      className={BANNER_LAYOUT}
      icon="fr-icon-lock-line"
      message={<FormattedMessage {...NominationFileLockEnumMessages[props.lockedReason]} />}
      tone="neutral"
    />
  );
}
