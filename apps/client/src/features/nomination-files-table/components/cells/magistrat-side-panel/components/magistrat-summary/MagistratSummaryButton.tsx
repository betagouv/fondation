import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useArchivedSession } from '@/shared/context/archived-session';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useCreateSummaryMutation } from '@queries/summary.queries';

export function MagistratSummaryButton(props: { sessionId: string; nominationFile: SessionNominationFile }) {
  const { isArchived } = useArchivedSession();
  const isSg = useIsSg();
  const navigate = useNavigate();
  const { mutate, reset, isPending: isCreating } = useCreateSummaryMutation();

  const link = React.useMemo(
    () =>
      ROUTE_PATHS.SUMMARY.replace(':sessionId', props.sessionId).replace(':fileId', props.nominationFile.id),
    [props],
  );

  const { summary } = props.nominationFile;

  const canReadSummary = React.useMemo(() => !!summary?.canRead, [summary]);
  const canCreateSummary = React.useMemo(() => !isArchived && !summary && isSg, [isArchived, summary, isSg]);

  const createSummary = React.useCallback(() => {
    mutate(
      { sessionId: props.sessionId, nominationFileId: props.nominationFile.id },
      {
        onSuccess: () => navigate(link),
        onSettled: () => reset(),
      },
    );
  }, [link, props, mutate, reset, navigate]);

  if (!canReadSummary && !canCreateSummary) return null;

  if (canCreateSummary) {
    return (
      <Button disabled={isCreating} onClick={createSummary} priority="secondary" size="small">
        <FormattedMessage defaultMessage="Écrire une synthèse" />
      </Button>
    );
  }

  return (
    <Button iconId="ri-eye-fill" linkProps={{ to: link }} priority="tertiary no outline" size="small">
      <FormattedMessage defaultMessage="Voir la synthèse" />
    </Button>
  );
}
