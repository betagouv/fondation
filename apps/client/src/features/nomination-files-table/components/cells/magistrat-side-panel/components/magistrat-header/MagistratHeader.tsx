import Button from '@codegouvfr/react-dsfr/Button';
import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useMagistratAffectation } from '../../hooks/use-magistrat-affectation/use-magistrat-affectation.hook';
import { useUnsavedGuard } from '../../hooks/use-unsaved-guard/use-unsaved-guard.hook';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { ReportersAlert } from '@/features/nomination-files-table/components/cells/reporters/ReportersAlert';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { toFullName } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratPrioritySelect, MagistratReporterSelect } from './MagistratAffectationFields';

export function MagistratHeader(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { nominationFile, sessionId } = props;
  const { user } = useUser();
  const { isEditable } = useNominationFilesTable();
  const isSgContext = useIsSgNavigation();
  const { nomMagistrat, isUpdatable } = nominationFile.content;

  const [isEditing, setIsEditing] = React.useState(false);

  const affectation = useMagistratAffectation({
    nominationFile,
    sessionId,
    onSaved: () => setIsEditing(false),
  });

  const startEditing = () => setIsEditing(true);
  const stopEditing = () => setIsEditing(false);

  const prioritiesDirty = isEditing && affectation.prioritiesDirty;
  const reportersDirty = isEditing && affectation.reportersDirty;
  const showWarning = useUnsavedGuard('magistrat-header', prioritiesDirty || reportersDirty);

  const canEdit = isEditable && !!isUpdatable;

  const isReporter = !!user && nominationFile.reporters.some((reporter) => reporter.id === user.id);
  const surfaceClassName = isReporter
    ? 'bg-(--background-action-low-brown-cafe-creme)'
    : 'bg-(--background-alt-blue-france)';

  return (
    <div className={clsx('-mx-8 -mt-8 flex flex-col gap-6 p-8', surfaceClassName)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-6">
          {isEditing ? (
            <div className="flex flex-col gap-1">
              <MagistratPrioritySelect onChange={affectation.setPriorities} value={affectation.priorities} />
              {showWarning && prioritiesDirty && <UnsavedWarning />}
            </div>
          ) : (
            <PriorityBadgeList priorities={nominationFile.priorities} small={false} />
          )}
          <h2 className="fr-h3 fr-mb-0 text-(--text-title-blue-france)">
            <TitleNameIcons
              detailsLink={{
                context: isSgContext ? 'sg' : 'membre',
                magistratId: nominationFile.content.detectedMagistratId,
              }}
              lolfi={{ sessionId, nominationFileId: nominationFile.id }}
              name={nomMagistrat}
              small
            />
          </h2>
        </div>
        {canEdit &&
          (isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                className="btn-compact"
                disabled={affectation.isPending}
                onClick={stopEditing}
                priority="secondary"
                size="small"
              >
                <FormattedMessage defaultMessage="Annuler" />
              </Button>
              <Button
                className="btn-compact"
                disabled={affectation.isPending}
                onClick={affectation.save}
                priority="primary"
                size="small"
              >
                <FormattedMessage defaultMessage="Valider" />
              </Button>
            </div>
          ) : (
            <Button className="btn-compact" onClick={startEditing} priority="secondary" size="small">
              <FormattedMessage defaultMessage="Modifier" />
            </Button>
          ))}
      </div>
      {isEditing ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <ReportersAlert
              dossier={nominationFile}
              selectedReportersCount={affectation.reporterIds.length}
            />
            <MagistratReporterSelect
              available={affectation.availableRapporteurs}
              onChange={affectation.setReporterIds}
              value={affectation.reporterIds}
            />
          </div>
          {showWarning && reportersDirty && <UnsavedWarning />}
        </div>
      ) : (
        <ReporterStatus currentUserId={user?.id} reporters={nominationFile.reporters} />
      )}
    </div>
  );
}

function UnsavedWarning() {
  return (
    <p className="fr-error-text mt-2" role="alert">
      <FormattedMessage defaultMessage="Modifications non enregistrées. Cliquez sur Valider pour sauvegarder." />
    </p>
  );
}

type Reporter = { id: string; firstName: string; lastName: string };

function ReporterStatus(props: { currentUserId: string | undefined; reporters: readonly Reporter[] }) {
  const { currentUserId, reporters } = props;
  if (reporters.length === 0)
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-base/6 text-(--text-default-grey)">
        <FormattedMessage defaultMessage="Affectation non effectuée" />
      </div>
    );

  const isReporter = reporters.some((reporter) => reporter.id === currentUserId);

  if (!isReporter) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-base/6 text-(--text-default-grey)">
        <FormattedMessage
          defaultMessage="{count, plural, one {Rapporteur} other {Rapporteurs}} :"
          values={{ count: reporters.length }}
        />
        {reporters.map((reporter) => (
          <Tag
            className="bg-(--background-default-grey)! text-(--text-action-high-blue-france)!"
            key={reporter.id}
          >
            {toFullName(reporter)}
          </Tag>
        ))}
      </div>
    );
  }

  const coReporters = reporters.filter((reporter) => reporter.id !== currentUserId);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-base/6 text-(--text-default-grey)">
      <span className="font-bold">
        <FormattedMessage defaultMessage="Vous êtes rapporteur" />
      </span>
      {coReporters.length > 0 && <FormattedMessage defaultMessage="avec" />}
      {coReporters.map((reporter) => (
        <Tag
          className="bg-(--background-default-grey)! text-(--text-action-high-blue-france)!"
          key={reporter.id}
        >
          {toFullName(reporter)}
        </Tag>
      ))}
    </div>
  );
}
