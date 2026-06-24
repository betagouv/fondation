import Button from '@codegouvfr/react-dsfr/Button';
import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { ReportersAlert } from '@/features/nomination-files-table/components/cells/reporters/ReportersAlert';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { LolfiMagistratLink } from '@/shared/components/LolfiMagistratLink';
import { PriorityBadgeList } from '@/shared/components/priorities/PriorityBadge';
import { toFullName } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratPrioritySelect, MagistratReporterSelect } from './MagistratAffectationFields';
import { useMagistratAffectation } from './useMagistratAffectation';

export function MagistratHeader(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { nominationFile, sessionId } = props;
  const isSg = useIsSgNavigation();
  const { user } = useUser();
  const { isEditable } = useNominationFilesTable();
  const { nomMagistrat, isUpdatable } = nominationFile.content;

  const [isEditing, setIsEditing] = React.useState(false);
  React.useEffect(() => setIsEditing(false), [nominationFile.id]);

  const affectation = useMagistratAffectation({
    nominationFile,
    sessionId,
    onSaved: () => setIsEditing(false),
  });

  const canEdit = isEditable && !!isUpdatable;

  const surfaceClassName = isSg
    ? 'bg-(--background-alt-blue-france)'
    : 'bg-(--background-action-low-brown-cafe-creme)';

  return (
    <div className={clsx('-mx-6 -mt-6 flex flex-col gap-6 p-8', surfaceClassName)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-6">
          {isEditing ? (
            <MagistratPrioritySelect
              onChange={affectation.setPriorities}
              surfaceClassName={surfaceClassName}
              value={affectation.priorities}
            />
          ) : (
            <PriorityBadgeList priorities={nominationFile.priorities} />
          )}
          <h2 className="fr-h3 fr-mb-0 text-(--text-title-blue-france)">
            {nomMagistrat}
            <LolfiMagistratLink
              name={nomMagistrat}
              nominationFileId={nominationFile.id}
              sessionId={sessionId}
              small
            />
          </h2>
        </div>
        {canEdit &&
          (isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                disabled={affectation.isPending}
                onClick={() => setIsEditing(false)}
                priority="secondary"
                size="small"
              >
                <FormattedMessage defaultMessage="Annuler" />
              </Button>
              <Button
                disabled={affectation.isPending}
                onClick={affectation.save}
                priority="primary"
                size="small"
              >
                <FormattedMessage defaultMessage="Valider" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} priority="secondary" size="small">
              <FormattedMessage defaultMessage="Modifier" />
            </Button>
          ))}
      </div>
      {isEditing ? (
        <div className="flex items-center gap-1">
          <ReportersAlert dossier={nominationFile} selectedReportersCount={affectation.reporterIds.length} />
          <MagistratReporterSelect
            available={affectation.availableRapporteurs}
            onChange={affectation.setReporterIds}
            surfaceClassName={surfaceClassName}
            value={affectation.reporterIds}
          />
        </div>
      ) : (
        <ReporterStatus currentUserId={user?.id} reporters={nominationFile.reporters} />
      )}
    </div>
  );
}

type Reporter = { id: string; firstName: string; lastName: string };

function ReporterStatus(props: { currentUserId: string | undefined; reporters: readonly Reporter[] }) {
  const { currentUserId, reporters } = props;
  if (reporters.length === 0)
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-base/6 text-(--text-default-grey)">
        <FormattedMessage defaultMessage="Aucun rapporteur affecté" />
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
