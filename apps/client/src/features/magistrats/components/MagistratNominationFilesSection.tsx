import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { useMagistratNominationFilesQuery } from '@queries/magistrats.queries';

import { MagistratNominationFilesTable } from './MagistratNominationFilesTable';

export function MagistratNominationFilesSection(props: { context: 'sg' | 'membre'; magistratId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMagistratNominationFilesQuery({ magistratId: props.magistratId });

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
      <MagistratNominationFilesTable
        context={props.context}
        nominationFiles={nominationFiles}
        onEndReached={fetchMore}
      />
    </>
  );
}
