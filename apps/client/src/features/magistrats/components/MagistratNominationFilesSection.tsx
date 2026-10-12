import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { useMagistratNominationFilesQuery } from '@queries/magistrats.queries';

import { MagistratNominationFilesTable } from './MagistratNominationFilesTable';

export function MagistratNominationFilesSection(props: { context: 'sg' | 'membre'; magistratId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMagistratNominationFilesQuery({ magistratId: props.magistratId });

  if (isLoading) {
    return (
      <p className="fr-mb-0">
        <FormattedMessage defaultMessage="Chargement..." />
      </p>
    );
  }

  const nominationFiles = data?.pages.flatMap((page) => page?.items ?? []) ?? [];
  if (nominationFiles.length === 0) {
    return (
      <p className="fr-mb-0">
        <FormattedMessage defaultMessage="Aucune proposition" />
      </p>
    );
  }

  return (
    <>
      <MagistratNominationFilesTable context={props.context} nominationFiles={nominationFiles} />
      {hasNextPage && (
        <Button
          className="fr-mt-2v"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
          priority="secondary"
          size="small"
        >
          <FormattedMessage defaultMessage="Voir plus" />
        </Button>
      )}
    </>
  );
}
