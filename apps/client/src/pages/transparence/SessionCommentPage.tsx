import Button from '@codegouvfr/react-dsfr/Button';
import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link, useParams } from 'react-router';

import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { SessionCommentField } from '@/features/transparence/components/session/SessionCommentField';
import { useSessionCommentDraft } from '@/features/transparence/hooks/useSessionCommentDraft';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function SessionCommentPage() {
  const { formatMessage } = useIntl();
  const { sessionId = '' } = useParams();
  const { data: session, isPending } = useDetailedNominationSessionQuery({ sessionId });
  const draft = useSessionCommentDraft({ sessionId });
  const { setDirty } = useUnsavedChangesGuard({ onSave: draft.save });

  useEffect(() => setDirty(draft.isDirty), [draft.isDirty, setDirty]);

  if (isPending) return null;

  if (!session) {
    return (
      <div className="fr-container fr-pt-5v">
        <FormattedMessage defaultMessage="Session de type Transparence non trouvée." />
      </div>
    );
  }

  const sessionPath = generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId });

  return (
    <DocumentScreen
      actions={
        !session.isArchived && (
          <>
            <Button disabled={!draft.isDirty || draft.isPending} onClick={draft.cancel} priority="secondary">
              <FormattedMessage defaultMessage="Annuler les changements" />
            </Button>
            <Button
              disabled={!draft.isDirty || draft.isPending}
              onClick={() => void draft.save().catch(() => {})}
            >
              <FormattedMessage defaultMessage="Valider le commentaire" />
            </Button>
          </>
        )
      }
      backLink={
        <Link className="fr-link fr-link--icon-left fr-icon-arrow-left-line" to={sessionPath}>
          <FormattedMessage defaultMessage="Fermer" />
        </Link>
      }
      breadcrumb={
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane du commentaire d'une session" })}
          breadcrumb={{
            currentPageLabel: formatMessage({ defaultMessage: 'Commentaire' }),
            segments: [
              {
                label: formatMessage({ defaultMessage: 'Secrétariat général' }),
                to: ROUTE_PATHS.SG.DASHBOARD,
              },
              {
                label: formatMessage({ defaultMessage: 'Gérer une session' }),
                to: ROUTE_PATHS.SG.MANAGE_SESSION,
              },
              { label: session.name, to: sessionPath },
            ],
          }}
          id="session-comment-breadcrumb"
        />
      }
      title={<FormattedMessage defaultMessage="Commentaire" />}
    >
      <div className="w-full">
        <SessionCommentField draft={draft} isArchived={session.isArchived} rows={20} />
      </div>
    </DocumentScreen>
  );
}
