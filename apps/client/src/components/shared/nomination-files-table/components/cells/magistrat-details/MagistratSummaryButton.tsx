import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { useNavigate } from 'react-router';

import { useIsSg } from '@/hooks/roles.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useCreateSummaryMutation } from '@queries/summary.queries';

export function MagistratSummaryButton(props: { sessionId: string; nominationFile: SessionNominationFile }) {
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
  const canCreateSummary = React.useMemo(() => !summary && isSg, [summary, isSg]);

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
      <Button
        size="small"
        priority="tertiary no outline"
        iconId="fr-icon-edit-fill"
        disabled={isCreating}
        onClick={createSummary}
      >
        Écrire une synthèse
      </Button>
    );
  }

  return (
    <Button size="small" priority="tertiary no outline" iconId="ri-eye-fill" linkProps={{ to: link }}>
      Voir la synthèse
    </Button>
  );
}
