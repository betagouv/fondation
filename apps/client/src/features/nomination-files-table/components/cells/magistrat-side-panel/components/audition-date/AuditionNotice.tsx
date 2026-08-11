import Button from '@codegouvfr/react-dsfr/Button';
import { useIntl } from 'react-intl';

import { AuditionBanner } from '@/shared/components/audition-banner';
import type { PlainDateOnly } from '@/utils/date-only.util';
import { isPastSchedule, type PlainTimeOnly } from '@/utils/time-only.util';

import { AUDITION_SECTION_ID } from './AuditionDate';
import { AUDITION_DATE_INPUT_ID } from './AuditionDateForm';

export function AuditionNotice(props: {
  auditionDate: PlainDateOnly | null;
  auditionTime: PlainTimeOnly | null;
  editable: boolean;
}) {
  const { auditionDate, auditionTime, editable } = props;
  const { formatMessage } = useIntl();

  if (!auditionDate || !auditionTime) return null;

  const isPast = isPastSchedule(auditionDate, auditionTime);

  const goToDateField = () => {
    document.getElementById(AUDITION_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById(AUDITION_DATE_INPUT_ID)?.focus({ preventScroll: true });
  };

  return (
    <AuditionBanner className="-mx-8 -mt-10 px-8 py-4" date={auditionDate} time={auditionTime}>
      {editable && !isPast && (
        <Button
          className="ml-auto min-h-0! px-3.5! py-0! whitespace-nowrap text-(--text-default-info)! underline underline-offset-4 hover:bg-transparent! hover:decoration-2"
          onClick={goToDateField}
          priority="tertiary no outline"
          size="small"
        >
          {formatMessage({ defaultMessage: 'Modifier' })}
        </Button>
      )}
    </AuditionBanner>
  );
}
