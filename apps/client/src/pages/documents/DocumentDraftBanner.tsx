import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { useUser } from '@queries/auth.queries';

type Writer = { id: string; name: string } | null;

/** who opened the draft and when, and who last worked on it: nobody named means the application */
export type DraftTrace = {
  openedAt: string;
  openedBy: Writer;
  systemUpdatedAt: string | null;
  updatedAt: string | null;
  updatedBy: Writer;
};

export function DocumentDraftBanner(props: {
  children?: ReactNode;
  draft?: DraftTrace | null;
  hasValidatedVersion: boolean;
  kind: 'agenda' | 'notice' | 'officialReport';
  /** why the application changed the draft on its own, whether or not a person works on it too */
  systemUpdate?: ReactNode;
}) {
  const { draft, hasValidatedVersion, systemUpdate } = props;

  return (
    <AlertBanner
      className="justify-center px-4 py-3 text-center"
      message={
        <span className="flex flex-col">
          <span className="font-medium">
            <span aria-hidden className="fr-icon-draft-line fr-icon--sm fr-mr-1w" />
            {hasValidatedVersion ? (
              <FormattedMessage defaultMessage="Brouillon en cours : le PDF reste celui de la version validée tant que ce brouillon n'est pas validé" />
            ) : (
              <FormattedMessage defaultMessage="Brouillon : le PDF sera produit à la validation" />
            )}
          </span>
          {(draft || systemUpdate) && (
            <span className="fr-text--sm fr-mb-0">
              {draft && <DocumentDraftHistory draft={draft} kind={props.kind} />}
              {draft && systemUpdate && ' - '}
              {systemUpdate &&
                (draft?.systemUpdatedAt ? (
                  <DocumentDraftSystemUpdate at={draft.systemUpdatedAt} reason={systemUpdate} />
                ) : (
                  <FormattedMessage
                    defaultMessage="Mis à jour automatiquement ({reason})"
                    values={{ reason: systemUpdate }}
                  />
                ))}
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

function DocumentDraftSystemUpdate(props: { at: string; reason: ReactNode }) {
  const dateAndTime = useDateAndTime();

  return (
    <FormattedMessage
      defaultMessage="Mis à jour automatiquement le {date} à {time} ({reason})"
      values={{ ...dateAndTime(props.at), reason: props.reason }}
    />
  );
}

function useWho() {
  const { user } = useUser();

  return (writer: NonNullable<Writer>) => (writer.id === user?.id ? 'vous' : writer.name);
}
