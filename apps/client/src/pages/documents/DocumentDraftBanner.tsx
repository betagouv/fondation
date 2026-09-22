import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';

export function DocumentDraftBanner(props: { children?: ReactNode; hasValidatedVersion: boolean }) {
  return (
    <AlertBanner
      className="justify-center px-4 py-3 text-center"
      icon="fr-icon-draft-line"
      message={
        props.hasValidatedVersion ? (
          <FormattedMessage defaultMessage="Brouillon en cours. Le document validé reste inchangé tant que vous n'avez pas validé celui-ci." />
        ) : (
          <FormattedMessage defaultMessage="Brouillon. Ce document ne sera disponible qu'une fois validé." />
        )
      }
      tone="info"
    >
      {props.children}
    </AlertBanner>
  );
}
