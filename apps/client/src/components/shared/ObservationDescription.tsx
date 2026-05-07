import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import React from 'react';
import { useDebounce } from 'use-debounce';

import { useIsSg } from '@/hooks/roles.hook';
import { DateOnly } from '@/models/date-only.model';
import type { GetObservationDetailsResponseDto } from '@api/types';
import { useUpdateObservationMutation } from '@queries/observations.queries';

function ObservationDescriptionReadOnly(props: { observation: GetObservationDetailsResponseDto }) {
  return <div className="rounded-sm bg-gray-100 p-4">{props.observation.description}</div>;
}

function ObservationDescriptionEditor(props: {
  sessionId: string;
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
}) {
  const [description, setDescription] = React.useState(props.observation.description);
  const [debouncedDescription] = useDebounce(description, 400);
  const { mutate } = useUpdateObservationMutation();

  React.useEffect(() => {
    mutate({
      description: debouncedDescription,
      dateReception: DateOnly.fromDateOnly(props.observation.receptionDate, 'yyyy-MM-dd'),
      magistratId: props.observation.observant.id,
      observationId: props.observation.id,
      nominationFileId: props.nominationFileId,
      sessionId: props.sessionId,
      linkedObservationsAttachments: [],
    });
  }, [props, mutate, debouncedDescription]);

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value || '';
      setDescription(value);
    },
    [setDescription],
  );

  return <Input textArea label="" nativeTextAreaProps={{ value: description, onChange, autoFocus: true }} />;
}

export function ObservationDescription(props: {
  sessionId: string;
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
}) {
  const isSg = useIsSg();
  const [isEditing, setEditing] = React.useState<boolean>(false);

  const toggleEditing = React.useCallback(() => {
    setEditing((editing) => !editing);
  }, [setEditing]);

  return (
    <>
      <h2 className="fr-h4 flex justify-between">
        <span>Historique observant</span>
        {isSg ? (
          isEditing ? (
            <Button
              size="small"
              onClick={toggleEditing}
              priority="primary"
              iconId={'ri-check-line'}
              title={'Sauvegarder les changements'}
            >
              Ok
            </Button>
          ) : (
            <Button
              size="small"
              onClick={toggleEditing}
              priority="tertiary no outline"
              iconId={'fr-icon-edit-fill'}
              title={'Éditer le commentaire'}
            />
          )
        ) : null}
      </h2>

      {isEditing ? (
        <ObservationDescriptionEditor
          sessionId={props.sessionId}
          nominationFileId={props.nominationFileId}
          observation={props.observation}
        />
      ) : (
        <ObservationDescriptionReadOnly observation={props.observation} />
      )}
    </>
  );
}
