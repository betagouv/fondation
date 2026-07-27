import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { BiographyList } from '@/shared/components/biography-list';
import { DetailsCard, DetailsPageLayout } from '@/shared/ui/details';
import type { DetailedMagistratDto, ListedMagistratObservationsDto } from '@api/types';

import { MagistratDetailsHeader } from './MagistratDetailsHeader';
import { MagistratIdentityCard } from './MagistratIdentityCard';
import { type MagistratNominationFile, MagistratNominationFilesTable } from './MagistratNominationFilesTable';

type MagistratObservation = ListedMagistratObservationsDto['items'][number];

type PaginatedList<T> = {
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  items: T[];
  onLoadMore: () => void;
};

type MagistratDetailsContentProps = {
  context: 'sg' | 'membre';
  magistrat: DetailedMagistratDto;
  nominationFiles: PaginatedList<MagistratNominationFile>;
  observations: PaginatedList<MagistratObservation>;
};

export function MagistratDetailsContent({
  context,
  magistrat,
  nominationFiles,
  observations,
}: MagistratDetailsContentProps) {
  const careerHistory = magistrat.careerHistory?.trim();

  return (
    <DetailsPageLayout
      background="terreBattue"
      header={<MagistratDetailsHeader context={context} magistrat={magistrat} />}
      identity={<MagistratIdentityCard magistrat={magistrat} />}
    >
      {careerHistory ? (
        <DetailsCard>
          <h2 className="fr-h4">
            <FormattedMessage defaultMessage="Biographie" />
          </h2>
          <BiographyList biography={careerHistory} />
        </DetailsCard>
      ) : null}

      <DetailsCard>
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Propositions" />
        </h2>
        <PaginatedTable
          context={context}
          emptyMessage={<FormattedMessage defaultMessage="Aucune proposition" />}
          list={nominationFiles}
        />
      </DetailsCard>

      <DetailsCard>
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Observations" />
        </h2>
        <PaginatedTable
          context={context}
          emptyMessage={<FormattedMessage defaultMessage="Aucune observation" />}
          list={{ ...observations, items: observations.items.map((o) => o.nominationFile) }}
        />
      </DetailsCard>
    </DetailsPageLayout>
  );
}

function PaginatedTable(props: {
  context: 'sg' | 'membre';
  emptyMessage: React.ReactNode;
  list: PaginatedList<MagistratNominationFile>;
}) {
  if (props.list.isLoading) {
    return (
      <p className="fr-mb-0">
        <FormattedMessage defaultMessage="Chargement..." />
      </p>
    );
  }

  if (props.list.items.length === 0) {
    return <p className="fr-mb-0">{props.emptyMessage}</p>;
  }

  return (
    <>
      <MagistratNominationFilesTable context={props.context} nominationFiles={props.list.items} />
      {props.list.hasMore && (
        <Button
          className="fr-mt-2v"
          disabled={props.list.isLoadingMore}
          onClick={props.list.onLoadMore}
          priority="secondary"
          size="small"
        >
          <FormattedMessage defaultMessage="Voir plus" />
        </Button>
      )}
    </>
  );
}
