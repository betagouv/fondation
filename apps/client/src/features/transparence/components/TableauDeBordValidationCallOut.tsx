import Notice, { type NoticeProps } from '@codegouvfr/react-dsfr/Notice';
import React from 'react';

import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { useAlerts } from '@/shared/context/alerts/alerts.context';
import type { DetailedNominationSessionDto } from '@api/types';
import { useUser } from '@queries/auth.queries';
import { useValidateSessionMutation } from '@queries/nomination-sessions.queries';

export function TableauDeBordValidationCallOut(props: {
  session: DetailedNominationSessionDto | null | undefined;
}) {
  const alerts = useAlerts();
  const [isClosed, setIsClosed] = React.useState(false);

  const { user } = useUser();
  const confirmation = useConfirmation();

  const { mutate: validateSession, isPending: isValidatingSession } = useValidateSessionMutation();

  const onValidateSession = React.useCallback(async () => {
    if (!user || !props.session?.id) return;

    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: `Valider la session ?`,
      content: <p>En validant, cette alerte ne sera plus affiché</p>,
      i18n: {
        cancel: 'Annuler',
        confirm: 'Confirmer et masquer cette alerte',
      },
    });

    if (isConfirmed) {
      validateSession(
        { sessionId: props.session.id, userId: user.id },
        {
          onSuccess: () => setIsClosed(true),
          onError: () => alerts.pushAlert({ severity: 'error', title: `Error pendant la validation` }),
        },
      );
    }
  }, [confirmation, props, user, validateSession, alerts, setIsClosed]);

  if (!props.session || props.session.isValidated) return null;

  const noticeProps = {
    isClosed,
    isClosable: !isValidatingSession,
    onClose: onValidateSession,
  } as unknown as NoticeProps;

  return (
    <Notice
      {...noticeProps}
      severity="warning"
      title="Nouvelle session"
      classes={{ root: 'fr-mb-6v', description: 'fr-ml-1v' }}
      description="Merci de valider les données"
    />
  );
}
