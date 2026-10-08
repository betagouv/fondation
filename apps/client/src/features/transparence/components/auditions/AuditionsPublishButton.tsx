import Button from '@codegouvfr/react-dsfr/Button';
import { useIntl } from 'react-intl';

import { useToasts } from '@/shared/ui/toast';
import { useLastAuditionsPublicationQuery, usePublishAuditionsMutation } from '@queries/auditions.queries';

// like the affectations, the button only shows while the members do not see the current auditions
export function AuditionsPublishButton(props: { sessionId: string }) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { data: publication } = useLastAuditionsPublicationQuery({ sessionId: props.sessionId });
  const { isPending: isPublishing, mutate: publish } = usePublishAuditionsMutation();

  if (!publication || publication.status === 'PUBLISHED') return null;

  return (
    <Button
      className="min-h-9! py-1.5!"
      disabled={isPublishing}
      iconId="ri-megaphone-fill"
      onClick={() =>
        publish(
          { sessionId: props.sessionId },
          {
            onError: () =>
              toasts.error({
                title: formatMessage({ defaultMessage: 'Erreur lors de la publication des auditions' }),
              }),
            onSuccess: () =>
              toasts.success({ title: formatMessage({ defaultMessage: 'Auditions publiées aux membres' }) }),
          },
        )
      }
      priority="primary"
      size="small"
    >
      {isPublishing
        ? formatMessage({ defaultMessage: 'Publication en cours...' })
        : formatMessage({ defaultMessage: 'Publier aux membres' })}
    </Button>
  );
}
