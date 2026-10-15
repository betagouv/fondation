import type { ReactNode } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsCard, DetailsHeader, DetailsPageLayout } from '@/shared/ui/details';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { DetailedMemberDto } from '@api/types';
import { useExcludedJurisdictionsMutation } from '@queries/members.queries';

import { DetailsMemberStats } from './DetailsMemberStats';
import { JurisdictionSelector } from './JurisdictionSelector';
import { MemberDisplayTitle } from './MemberDisplayTitle';
import { MemberTitle } from './MemberTitle';

const FORMATION_LABELS = defineMessages({
  MEMBRE_COMMUN: { defaultMessage: 'Commun' },
  MEMBRE_DU_PARQUET: { defaultMessage: 'Parquet' },
  MEMBRE_DU_SIEGE: { defaultMessage: 'Siège' },
} satisfies Record<DetailedMemberDto['role'], { defaultMessage: string }>);

function MemberInfoItem(props: { children: ReactNode; label: ReactNode }) {
  return (
    <div className="leading-relaxed">
      <dt className="inline p-0 font-bold whitespace-nowrap">{props.label}</dt>{' '}
      <dd className="m-0 inline p-0">{props.children}</dd>
    </div>
  );
}

function DetailsMemberHeader(props: { name: string }) {
  const { formatMessage } = useIntl();

  return (
    <DetailsHeader
      backTo={ROUTE_PATHS.SG.MANAGE_MEMBERS}
      backThroughHistory
      breadcrumb={
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de la fiche membre" })}
          breadcrumb={{
            currentPageLabel: props.name,
            segments: [
              {
                label: formatMessage({ defaultMessage: 'Secrétariat général' }),
                to: ROUTE_PATHS.SG.DASHBOARD,
              },
              {
                label: formatMessage({ defaultMessage: 'Gérer les membres' }),
                to: ROUTE_PATHS.SG.MANAGE_MEMBERS,
              },
            ],
          }}
          className="fr-mt-0"
          id="member-details-breadcrumb"
        />
      }
      overline={<FormattedMessage defaultMessage="Fiche membre" />}
      title={props.name}
    />
  );
}

export function DetailsMember(props: { member: DetailedMemberDto }) {
  const { member } = props;
  const { mutateAsync: excludeMemberJurisdictions } = useExcludedJurisdictionsMutation({ userId: member.id });
  const name = `${capitalize(member.firstName)} ${member.lastName.toUpperCase()}`;

  return (
    <DetailsPageLayout
      background="blueFrance"
      header={<DetailsMemberHeader name={name} />}
      identity={
        <DetailsCard className="grow">
          <DetailsMemberStats stats={member.stats} />
        </DetailsCard>
      }
      identityPosition="right"
      wideIdentity
    >
      <DetailsCard>
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Informations" />
        </h2>
        <dl className="m-0 flex flex-col gap-2 p-0">
          <MemberInfoItem label={<FormattedMessage defaultMessage="Nom" />}>
            {member.lastName.toUpperCase()}
          </MemberInfoItem>
          <MemberInfoItem label={<FormattedMessage defaultMessage="Prénom" />}>
            {capitalize(member.firstName)}
          </MemberInfoItem>
          <MemberInfoItem label={<FormattedMessage defaultMessage="Email" />}>{member.email}</MemberInfoItem>
          <MemberInfoItem label={<FormattedMessage defaultMessage="Formation" />}>
            <FormattedMessage {...FORMATION_LABELS[member.role]} />
          </MemberInfoItem>
        </dl>
      </DetailsCard>

      <DetailsCard>
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Distinction et titre" />
        </h2>
        <dl className="m-0 flex flex-col gap-y-4 p-0">
          <MemberTitle member={member} />
          <MemberDisplayTitle member={member} />
        </dl>
      </DetailsCard>

      <DetailsCard>
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Attribution des rapports" />
        </h2>
        <dl className="m-0 flex flex-col gap-y-4 p-0">
          <div className="flex flex-row items-start justify-between gap-4">
            <dt className="shrink-0 font-bold">
              <FormattedMessage defaultMessage="Juridictions exclues" />
            </dt>
            <dd className="m-0 flex-1">
              <JurisdictionSelector
                onChange={excludeMemberJurisdictions}
                selected={member.excludedJurisdictions}
              />
            </dd>
          </div>
          <div className="flex flex-row items-center justify-between gap-4">
            <dt className="font-bold">
              <FormattedMessage defaultMessage="Personnes exclues" />
            </dt>
            <dd className="m-0 font-bold text-(--text-disabled-grey)">n/a</dd>
          </div>
        </dl>
      </DetailsCard>
    </DetailsPageLayout>
  );
}
