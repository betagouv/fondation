import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { useMagistratObservationsQuery } from '@queries/magistrats.queries';

import { MagistratNominationFilesTable } from './MagistratNominationFilesTable';

export function MagistratObservationsSection(props: { context: 'sg' | 'membre'; magistratId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMagistratObservationsQuery({
    magistratId: props.magistratId,
  });

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
        showAuditionDate={false}
      />
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
