import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { TransparenceSnapshot } from 'shared-models';

import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';
import { TableauDeBordEditTransparence } from './TableauDeBordEditTransparence';

export type TableauDeBordResumeProps = TransparenceSnapshot;
export const TableauDeBordResume = (transparence: TableauDeBordResumeProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  return (
    <div className={clsx('relative border-2 border-solid', cx('fr-px-12v', 'fr-py-4v', 'fr-col'))}>
      <Button
        className={'absolute right-3 top-3'}
        priority="tertiary no outline"
        iconId="fr-icon-edit-fill"
        title={`edit-session-${transparence.name}`}
        onClick={handleEdit}
      />

      <h1>Gérer une session</h1>

      {!isEditing && <TableauDeBordResumeDetails {...transparence} />}
      {isEditing && <TableauDeBordEditTransparence {...transparence} />}
    </div>
  );
};
