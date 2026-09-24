import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import {
  useSystemUpdateCauses,
  type SystemUpdateCause,
} from '@/features/documents/hooks/useSystemUpdateCauses';
import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { useUser } from '@queries/auth.queries';

type Writer = { id: string; name: string } | null;

/** who opened the draft and when, and who last worked on it: nobody named means the application */
export type DraftTrace = {
  openedAt: string;
  openedBy: Writer;
  /** every reason the application changed the draft for, empty on the drafts updated before it said */
  systemCauses: readonly SystemUpdateCause[];
  systemUpdatedAt: string | null;
  updatedAt: string | null;
  updatedBy: Writer;
};

export function DocumentDraftBanner(props: {
  children?: ReactNode;
  draft?: DraftTrace | null;
  hasValidatedVersion: boolean;
  kind: 'agenda' | 'notice' | 'officialReport';
  /** when the version the draft would replace was validated, null before that trace was kept */
  validatedAt?: string | null;
}) {
  const { draft, hasValidatedVersion, validatedAt } = props;
  const dateAndTime = useDateAndTime();

  return (
    <AlertBanner
      className="justify-center px-4 py-3 text-center"
      message={
        <span className="flex flex-col">
          <span className="font-medium">
            <span aria-hidden className="fr-icon-draft-line fr-icon--sm fr-mr-1w" />
            {hasValidatedVersion ? (
              <FormattedMessage
                defaultMessage="Modifications en cours, pas encore validées : le PDF reste celui de la version validée{validated, select, yes { le {date} à {time}} other {}}"
                values={{
                  ...(validatedAt ? dateAndTime(validatedAt) : {}),
                  validated: validatedAt ? 'yes' : 'no',
                }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Brouillon : le PDF sera disponible après avoir validé {kind, select, agenda {l'ODJ} officialReport {le PV} other {la notice}}"
                values={{ kind: props.kind }}
              />
            )}
          </span>
          {draft && (
            <span className="fr-text--sm fr-mb-0">
              <DocumentDraftHistory draft={draft} kind={props.kind} />
            </span>
          )}
          {draft?.systemUpdatedAt && (
            <span className="fr-text--sm fr-mb-0">
              <DocumentDraftSystemUpdate at={draft.systemUpdatedAt} causes={draft.systemCauses} />
            </span>
          )}
        </span>
      }
      tone="info"
    >
      {props.children}
    </AlertBanner>
  );
}

/** a notice has no version underneath: its draft is the notice itself, created rather than opened */
function DocumentDraftHistory(props: { draft: DraftTrace; kind: 'agenda' | 'notice' | 'officialReport' }) {
  const dateAndTime = useDateAndTime();
  const who = useWho();
  const { openedAt, openedBy, updatedAt, updatedBy } = props.draft;

  return (
    <>
      {openedBy ? (
        <FormattedMessage
          defaultMessage="{kind, select, notice {Créée} other {Ouvert}} le {date} à {time} par {who}"
          values={{ ...dateAndTime(openedAt), kind: props.kind, who: who(openedBy) }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="{kind, select, notice {Créée} other {Ouvert automatiquement}} le {date} à {time}"
          values={{ ...dateAndTime(openedAt), kind: props.kind }}
        />
      )}
      {updatedAt && updatedBy && (
        <>
          {' - '}
          <FormattedMessage
            defaultMessage="{kind, select, notice {Modifiée} other {Modifié}} le {date} à {time} par {who}"
            values={{ ...dateAndTime(updatedAt), kind: props.kind, who: who(updatedBy) }}
          />
        </>
      )}
    </>
  );
}

function DocumentDraftSystemUpdate(props: { at: string; causes: readonly SystemUpdateCause[] }) {
  const dateAndTime = useDateAndTime();
  const systemUpdateCauses = useSystemUpdateCauses();

  return (
    <FormattedMessage
      defaultMessage="{count, plural, =0 {Mis à jour automatiquement le {date} à {time}} =1 {Mis à jour automatiquement le {date} à {time} suite {causes}} other {Mis à jour automatiquement suite {causes}, la dernière fois le {date} à {time}}}"
      values={{
        ...dateAndTime(props.at),
        causes: systemUpdateCauses(props.causes),
        count: props.causes.length,
      }}
    />
  );
}

function useWho() {
  const { user } = useUser();

  return (writer: NonNullable<Writer>) => (writer.id === user?.id ? 'vous' : writer.name);
}
