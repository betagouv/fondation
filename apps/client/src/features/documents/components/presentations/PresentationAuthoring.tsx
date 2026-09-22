import { FormattedMessage } from 'react-intl';

import { useWhen } from '@/features/documents/hooks/useWhen';
import { useUser } from '@queries/auth.queries';

type Writer = { id: string; name: string } | null;

export function PresentationAuthoring(props: {
  createdAt: string;
  createdBy: Writer;
  updatedAt: string | null;
  updatedBy: Writer;
}) {
  const when = useWhen();
  const { createdAt, createdBy, updatedAt, updatedBy } = props;

  const sameWriter = Boolean(createdBy && updatedBy && createdBy.id === updatedBy.id);

  return (
    <span className="fr-text--sm fr-ml-2v text-(--text-mention-grey)">
      <FormattedMessage defaultMessage="Créée le {date} à {time}" values={when(createdAt)} />
      {!sameWriter && <PresentationWriter writer={createdBy} />}

      {updatedAt && (
        <>
          {' '}
          <FormattedMessage defaultMessage="et modifiée le {date} à {time}" values={when(updatedAt)} />
          <PresentationWriter writer={updatedBy} />
        </>
      )}
    </span>
  );
}

export function AgendaValidation(props: {
  createdAt: string;
  createdBy: Writer;
  validatedAt: string | null;
  validatedBy: Writer;
}) {
  const when = useWhen();
  const { createdAt, createdBy, validatedAt, validatedBy } = props;

  return (
    <span className="fr-text--sm fr-ml-2v text-(--text-mention-grey)">
      {validatedAt ? (
        <>
          <FormattedMessage defaultMessage="Validé le {date} à {time}" values={when(validatedAt)} />
          <PresentationWriter writer={validatedBy} />
        </>
      ) : (
        <>
          <FormattedMessage defaultMessage="Brouillon créé le {date} à {time}" values={when(createdAt)} />
          <PresentationWriter writer={createdBy} />
        </>
      )}
    </span>
  );
}

export function PresentationRestitution(props: { presentedAt: string | null; presentedBy: Writer }) {
  const when = useWhen();
  const { presentedAt, presentedBy } = props;

  return (
    <span className="fr-text--sm fr-ml-2v text-(--text-mention-grey)">
      {presentedAt ? (
        <>
          <FormattedMessage defaultMessage="Restituée le {date} à {time}" values={when(presentedAt)} />
          <PresentationWriter writer={presentedBy} />
        </>
      ) : (
        /** the notices restituted before the application kept that trace carry none */
        <FormattedMessage defaultMessage="Restituée à une date inconnue" />
      )}
    </span>
  );
}

function PresentationWriter(props: { writer: Writer }) {
  const { user } = useUser();
  const { writer } = props;

  if (!writer) return null;

  return (
    <>
      {/** the space sits outside the message: formatjs trims the ones a message starts with */}{' '}
      {writer.id === user?.id ? (
        <FormattedMessage defaultMessage="par vous" />
      ) : (
        <FormattedMessage defaultMessage="par {writer}" values={{ writer: writer.name }} />
      )}
    </>
  );
}
