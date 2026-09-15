import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useArchivedSession } from '@/shared/context/archived-session';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useCreateSummaryMutation } from '@queries/summary.queries';

export function SummaryButton(props: {
  canRead: boolean;
  hasSummary: boolean;
  nominationFileId: string;
  sessionId: string;
}) {
  const { isArchived } = useArchivedSession();
  const isSg = useIsSg();
  const navigate = useNavigate();
  const { mutate, reset, isPending: isCreating } = useCreateSummaryMutation();

  const link = React.useMemo(
    () =>
      ROUTE_PATHS.SUMMARY.replace(':sessionId', props.sessionId).replace(':fileId', props.nominationFileId),
    [props.nominationFileId, props.sessionId],
  );

  const canCreateSummary = !isArchived && !props.hasSummary && isSg;

  const createSummary = React.useCallback(() => {
    mutate(
      { sessionId: props.sessionId, nominationFileId: props.nominationFileId },
      {
        onSuccess: () => navigate(link),
        onSettled: () => reset(),
      },
    );
  }, [link, props.nominationFileId, props.sessionId, mutate, reset, navigate]);

  if (!props.canRead && !canCreateSummary) return null;

  if (canCreateSummary) {
    return (
      <Button disabled={isCreating} onClick={createSummary} priority="secondary" size="medium">
        <FormattedMessage defaultMessage="Écrire une synthèse" />
      </Button>
    );
  }

  return (
    <Button iconId="ri-eye-fill" linkProps={{ to: link }} priority="tertiary no outline" size="medium">
      <FormattedMessage defaultMessage="Voir la synthèse" />
    </Button>
  );
}
