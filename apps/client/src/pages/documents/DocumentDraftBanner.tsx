import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';

export function DocumentDraftBanner(props: {
  children?: ReactNode;
  hasValidatedVersion: boolean;
  /** why the application changed the draft on its own, whether or not a person works on it too */
  systemUpdate?: ReactNode;
}) {
  const draft = props.hasValidatedVersion ? (
    <FormattedMessage defaultMessage="Le document validé reste inchangé tant que vous n'avez pas validé celui-ci." />
  ) : (
    <FormattedMessage defaultMessage="Ce document ne sera disponible qu'une fois validé." />
  );

  return (
    <AlertBanner
      className="justify-center px-4 py-3 text-center"
      icon="fr-icon-draft-line"
      message={
        <>
          {props.systemUpdate ? (
            <FormattedMessage
              defaultMessage="Ce document a été mis à jour automatiquement : {reason}."
              values={{ reason: props.systemUpdate }}
            />
          ) : props.hasValidatedVersion ? (
            <FormattedMessage defaultMessage="Brouillon en cours." />
          ) : (
            <FormattedMessage defaultMessage="Brouillon." />
          )}{' '}
          {draft}
        </>
      }
      tone="info"
    >
      {props.children}
    </AlertBanner>
  );
}
