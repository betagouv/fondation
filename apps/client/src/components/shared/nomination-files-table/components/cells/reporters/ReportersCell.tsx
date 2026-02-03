import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import React from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useMemberListQuery } from '@queries/members.queries';
import { useNominationFilesTable } from '@/components/shared/nomination-files-table/contexts/files-table.context';
import { DropdownRapporteurs } from './DropdownRapporteurs';

function requires2Reporters(dossier: SessionNominationFile) {
  return (
    dossier.reporters.length > 0 &&
    dossier.reporters.length < 2 &&
    dossier.content.posteCible &&
    [
      'procureur general',
      'premier avocat general pres la cour de cassation',
      'avocat general près la cour de cassation',
      'procureur pres la cour de cassation',
      'procureur national anti-terroriste',
      'procureur national financier'
    ].some((position) =>
      (dossier.content.posteCible as string)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(position)
    )
  );
}

function ReportersAlert(props: { dossier: SessionNominationFile }) {
  if (!requires2Reporters(props.dossier)) return null;

  return (
    <div className="multi-reporters-alert cursor-pointer pr-1">
      <Tooltip title="2 rapporteurs attendus">
        <i
          style={{
            color: colors.decisions.text.default.warning.default,
            backgroundColor: colors.decisions.background.contrast.warning.default
          }}
          className={clsx(
            cx('fr-icon-warning-fill'),
            'text-center',
            'block',
            'rounded-full',
            'p-1',
            'size-6',
            'before:block',
            'before:content-[""]',
            'before:size-4'
          )}
        />
      </Tooltip>
    </div>
  );
}

function ReportersSelector(props: { dossier: SessionNominationFile }) {
  const { formation } = useNominationFilesTable();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 }
  });

  const reporters = React.useMemo(
    () => (data?.items ?? []).map(({ id, firstName, lastName }) => ({ userId: id, firstName, lastName })),
    [data]
  );

  return (
    <div className="flex items-center">
      <ReportersAlert dossier={props.dossier} />
      <DropdownRapporteurs fileId={props.dossier.id} reporters={reporters} />
    </div>
  );
}

function ReadOnlyReportersCell(props: { dossier: SessionNominationFile }) {
  if (props.dossier.reporters.length === 0) return '-';

  return (
    <div className="flex items-center">
      <ReportersAlert dossier={props.dossier} />
      <ul className="m-0 list-none p-0">
        {props.dossier.reporters.map(({ id, firstName, lastName }) => (
          <li key={id}>{`${firstName} ${lastName}`.toUpperCase()}</li>
        ))}
      </ul>
    </div>
  );
}

export function ReportersCell(props: { dossier: SessionNominationFile }) {
  const { edition } = useNominationFilesTable();

  if (edition?.isEditing) {
    return <ReportersSelector dossier={props.dossier} />;
  }

  return <ReadOnlyReportersCell dossier={props.dossier} />;
}
