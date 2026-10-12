import { FormattedMessage } from 'react-intl';

import { PresentationMoment } from '@/shared/components/presentation-moment';
import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { AlertBanner } from '@/shared/ui/alert-banner';
import type { PlainDateOnly } from '@/utils/date-only.util';
import type { PlainTimeOnly } from '@/utils/time-only.util';
import { useUser } from '@queries/auth.queries';

type Writer = { id: string; name: string } | null;
type Trace = { at: string; by: Writer };
type Presentation = { by: Writer; date: PlainDateOnly; endTime: PlainTimeOnly | null };

export function DocumentValidatedBanner(props: {
  kind: 'agenda' | 'notice' | 'officialReport';
  presentation?: Presentation | null;
  validation: Trace | null;
}) {
  const dateAndTime = useDateAndTime();
  const { user } = useUser();
  const { kind, presentation, validation } = props;

  const authorship = (by: Writer) => ({
    kind,
    who: !by ? 'nobody' : by.id === user?.id ? 'self' : 'someone',
    writer: by?.name,
  });

  if (!validation && !presentation) return null;

  return (
    <AlertBanner
      className="justify-center px-4 py-3 text-center"
      icon="fr-icon-success-line"
      message={
        <>
          {validation && (
            <FormattedMessage
              defaultMessage="{kind, select, notice {Validée} other {Validé}} le {date} à {time}{who, select, self { par vous} someone { par {writer}} other {}}"
              values={{ ...dateAndTime(validation.at), ...authorship(validation.by) }}
            />
          )}
          {validation && presentation && ' - '}
          {presentation && (
            <FormattedMessage
              defaultMessage="{kind, select, notice {Restituée} other {Restitué}} le {moment}{who, select, self { par vous} someone { par {writer}} other {}}"
              values={{
                ...authorship(presentation.by),
                moment: <PresentationMoment date={presentation.date} endTime={presentation.endTime} />,
              }}
            />
          )}
        </>
      }
      tone="neutral"
    />
  );
}
