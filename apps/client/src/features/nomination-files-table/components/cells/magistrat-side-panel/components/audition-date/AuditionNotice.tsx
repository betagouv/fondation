import { FormattedMessage } from 'react-intl';

import { AuditionScheduledBanner } from '@/shared/components/audition-banner';
import { AlertBanner, AlertBannerAction } from '@/shared/ui/alert-banner';
import type { PlainDateOnly } from '@/utils/date-only.util';
import { isPastSchedule, type PlainTimeOnly } from '@/utils/time-only.util';

import { AUDITION_SECTION_ID } from './AuditionDate';
import { AUDITION_DATE_INPUT_ID } from './AuditionDateForm';

const NOTICE_LAYOUT = '-mx-8 -mt-10 px-8 py-4';

export function AuditionNotice(props: {
  auditionDate: PlainDateOnly | null;
  auditionMissing: boolean;
  auditionTime: PlainTimeOnly | null;
  editable: boolean;
}) {
  const { auditionDate, auditionMissing, auditionTime, editable } = props;

  const goToDateField = () => {
    document.getElementById(AUDITION_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById(AUDITION_DATE_INPUT_ID)?.focus({ preventScroll: true });
  };

  if (auditionMissing) {
    return (
      <AlertBanner
        className={NOTICE_LAYOUT}
        icon="fr-icon-warning-fill"
        message={<FormattedMessage defaultMessage="Une audition est à prévoir pour ce poste" />}
        tone="warning"
      >
        {editable && (
          <AlertBannerAction onClick={goToDateField}>
            <FormattedMessage defaultMessage="Planifier" />
          </AlertBannerAction>
        )}
      </AlertBanner>
    );
  }

  return (
    <AuditionScheduledBanner className={NOTICE_LAYOUT} date={auditionDate} time={auditionTime}>
      {editable && !isPastSchedule(auditionDate, auditionTime) && (
        <AlertBannerAction onClick={goToDateField}>
          <FormattedMessage defaultMessage="Modifier" />
        </AlertBannerAction>
      )}
    </AuditionScheduledBanner>
  );
}
