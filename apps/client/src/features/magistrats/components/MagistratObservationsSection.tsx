import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { useMagistratObservationsQuery } from '@queries/magistrats.queries';

import { MagistratNominationFilesTable } from './MagistratNominationFilesTable';

export function MagistratObservationsSection(props: { context: 'sg' | 'membre'; magistratId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMagistratObservationsQuery({
    magistratId: props.magistratId,
  });

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

  const observations = data?.pages.flatMap((page) => page?.items ?? []) ?? [];
  if (observations.length === 0) {
    return (
      <p className="fr-mb-0">
        <FormattedMessage defaultMessage="Aucune observation" />
      </p>
    );
  }

  return (
    <>
      <MagistratNominationFilesTable
        context={props.context}
        nominationFiles={observations.map((observation) => observation.nominationFile)}
        onEndReached={fetchMore}
        showAuditionDate={false}
      />
    </>
  );
}
