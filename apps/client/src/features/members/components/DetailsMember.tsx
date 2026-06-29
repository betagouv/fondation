import { AlertsProvider } from '@/shared/context/alerts';
import { capitalize } from '@/utils/string.utils';
import type { DetailedMemberDto } from '@api/types';
import { useExcludedJurisdictionsMutation } from '@queries/members.queries';

import { DetailsMemberStats } from './DetailsMemberStats';
import { JurisdictionSelector } from './JurisdictionSelector';
import { MemberDisplayTitle } from './MemberDisplayTitle';
import { MemberTitle } from './MemberTitle';

export function DetailsMember(props: { member: DetailedMemberDto }) {
  const { mutateAsync: excludeMemberJurisdictions } = useExcludedJurisdictionsMutation({
    userId: props.member.id,
  });
  return (
    <div className="fr-pt-4v fr-pb-12v mx-auto max-w-2xl">
      <h1 className="fr-display-xl text-center">{`${capitalize(props.member.firstName)} ${props.member.lastName.toUpperCase()}`}</h1>

      <article className="fr-mt-16v flex flex-col gap-y-8">
        <section>
          <h2 className="fr-display-xs">Identifiants</h2>

          <dl className="flex flex-col gap-y-2">
            <div className="flex flex-row justify-between">
              <dt className="font-bold">Email</dt>
              <dd className="text-right">{props.member.email}</dd>
            </div>

            <div className="flex flex-row justify-between">
              <dt className="font-bold">Mot de passe</dt>
              <dd className="text-right">{`****`}</dd>
            </div>
          </dl>
        </section>
        <section>
          <h2 className="fr-display-xs">Détails du profil</h2>

          <dl className="flex flex-col gap-y-2">
            <div className="flex flex-row justify-between">
              <dt className="font-bold">Nom</dt>
              <dd className="text-right">{props.member.lastName.toUpperCase()}</dd>
            </div>

            <div className="flex flex-row justify-between">
              <dt className="font-bold">Prénom</dt>
              <dd className="text-right">{capitalize(props.member.firstName)}</dd>
            </div>

            <div className="flex flex-row justify-between">
              <dt className="font-bold">Formation</dt>
              <dd className="text-right">
                {props.member.role === 'MEMBRE_COMMUN'
                  ? 'Commun'
                  : props.member.role === 'MEMBRE_DU_SIEGE'
                    ? 'Siège'
                    : 'Parquet'}
              </dd>
            </div>

            <AlertsProvider>
              <AlertsProvider.Alerts />

              <MemberTitle member={props.member} />
            </AlertsProvider>

            <MemberDisplayTitle member={props.member} />
          </dl>
        </section>
        <section>
          <h2 className="fr-display-xs">Conditions d'attribution des rapports</h2>

          <dl className="flex flex-col gap-y-2">
            <div className="flex flex-row items-center justify-between">
              <dt className="font-bold">Juridictions exclues</dt>
              <dd className="text-right">
                <JurisdictionSelector
                  selected={props.member.excludedJurisdictions}
                  onChange={excludeMemberJurisdictions}
                />
              </dd>
            </div>

            <div className="flex flex-row items-center justify-between">
              <dt className="font-bold">Personnes exclues</dt>
              <dd className="text-right font-bold text-(--text-disabled-grey)">n/a</dd>
            </div>
          </dl>
        </section>
        <section>
          <h3>Statistiques d'attributions</h3>
          <DetailsMemberStats stats={props.member.stats} />
        </section>
      </article>
    </div>
  );
}
