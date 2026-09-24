import { FormattedMessage } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { useUser } from '@queries/auth.queries';

type Trace = { at: string; by: { id: string; name: string } | null };

export function DocumentValidatedBanner(props: {
  kind: 'agenda' | 'notice' | 'officialReport';
  presentation?: Trace | null;
  validation: Trace | null;
}) {
  const dateAndTime = useDateAndTime();
  const { user } = useUser();
  const { kind, presentation, validation } = props;

  const who = (trace: Trace) => (!trace.by ? 'nobody' : trace.by.id === user?.id ? 'self' : 'someone');
  const values = (trace: Trace) => ({
    ...dateAndTime(trace.at),
    kind,
    who: who(trace),
    writer: trace.by?.name,
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
              values={values(validation)}
            />
          )}
          {validation && presentation && ' - '}
          {presentation && (
            <FormattedMessage
              defaultMessage="{kind, select, notice {Restituée} other {Restitué}} le {date} à {time}{who, select, self { par vous} someone { par {writer}} other {}}"
              values={values(presentation)}
            />
          )}
        </>
      }
      tone="neutral"
    />
  );
}
