import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { EditTransparencyDto, TransparenceSnapshot } from 'shared-models';

import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { useEditTransparency } from '../../../../../../react-query/mutations/sg/edit-transparency.mutation';
import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';
import { TableauDeBordEditTransparence } from './TableauDeBordEditTransparence';

export type TableauDeBordResumeProps = TransparenceSnapshot;
export const TableauDeBordResume = (transparence: TableauDeBordResumeProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const { mutateAsync, isSuccess, isError } = useEditTransparency();

  const onSubmit = async (data: EditTransparencyDto) => {
    await mutateAsync({ id: transparence.id, transparency: data });
    toggleEdit();
  };

  return (
    <div className="fr-col flex flex-col gap-3">
      {isSuccess && (
        <Alert
          id="edit-transparence-success"
          closable
          severity="success"
          title="Transparence modifiée avec succès"
        />
      )}
      {isError && (
        <Alert
          id="edit-transparence-error"
          closable
          severity="error"
          title="Erreur lors de la modification de la transparence"
        />
      )}
      <div className={clsx('relative border-2 border-solid', cx('fr-px-12v', 'fr-py-4v'))}>
        <Button
          className={'absolute right-3 top-3'}
          priority="tertiary no outline"
          iconId={isEditing ? 'fr-icon-close-line' : 'fr-icon-edit-fill'}
          title={`edit-session-${transparence.name}`}
          onClick={toggleEdit}
        />

        <h1>Gérer une session</h1>

        <div className="flex">
          {!isEditing && <TableauDeBordResumeDetails {...transparence} />}
          {isEditing && (
            <TableauDeBordEditTransparence
              transparence={transparence}
              onCancel={toggleEdit}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
};
