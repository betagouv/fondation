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

/** nobody named means the application */
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
              <FormattedMessage defaultMessage="Brouillon : le PDF sera disponible après avoir validé le document" />
            )}
          </span>
          {draft && (
            <span className="fr-text--sm fr-mb-0">
              <DocumentDraftHistory
                draft={draft}
                hasValidatedVersion={hasValidatedVersion}
                kind={props.kind}
              />
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

function DocumentDraftHistory(props: {
  draft: DraftTrace;
  hasValidatedVersion: boolean;
  kind: 'agenda' | 'notice' | 'officialReport';
}) {
  const dateAndTime = useDateAndTime();
  const who = useWho();
  const { openedAt, openedBy, updatedAt, updatedBy } = props.draft;
  // the draft of a validated document is a copy made when someone starts changing it, not the document's creation
  const opening = props.hasValidatedVersion ? 'reopened' : props.kind;

  return (
    <>
      {openedBy ? (
        <FormattedMessage
          defaultMessage="{opening, select, reopened {Modifications commencées} notice {Créée} other {Créé}} le {date} à {time} par {who}"
          values={{ ...dateAndTime(openedAt), opening, who: who(openedBy) }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="{opening, select, reopened {Modifications commencées automatiquement} notice {Créée} other {Créé automatiquement}} le {date} à {time}"
          values={{ ...dateAndTime(openedAt), opening }}
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
