import { capitalize } from '../../../../utils/string.utils';
import { useExcludedJurisdictionsMutation, type DetailedMember } from '../members.queries';
import { JurisdictionSelector } from './JurisdictionSelector';

export function DetailsMember(props: { member: DetailedMember }) {
  const { mutateAsync: excludeMemberJurisdictions } = useExcludedJurisdictionsMutation({
    userId: props.member.id
  });
  return (
    <div className="mx-auto max-w-2xl pb-12 pt-4">
      <h1 className="fr-display-xl text-center">{`${capitalize(props.member.firstName)} ${props.member.lastName.toUpperCase()}`}</h1>

      <article className="mt-16 flex flex-col gap-y-8">
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
              <dt className="font-bold">Membre</dt>
              <dd className="text-right">
                {props.member.role === 'MEMBRE_COMMUN'
                  ? 'Commun'
                  : props.member.role === 'MEMBRE_DU_SIEGE'
                    ? 'Siège'
                    : 'Parquet'}
              </dd>
            </div>
          </dl>
        </section>
        <section>
          <h2 className="fr-display-xs">Conditions d'attribution des rapports</h2>

          <dl className="flex flex-col gap-y-2">
            <div className="flex flex-row justify-between">
              <dt className="font-bold">Juridictions exclues</dt>
              <dd className="text-right">
                <JurisdictionSelector
                  selected={props.member.excludedJurisdictions}
                  onChange={excludeMemberJurisdictions}
                />
              </dd>
            </div>

            <div className="flex flex-row justify-between">
              <dt className="font-bold">Personnes exclues</dt>
              <dd className="text-right font-bold text-gray-300">n/a</dd>
            </div>
          </dl>
        </section>
      </article>
    </div>
  );
}
