import { Input } from '@codegouvfr/react-dsfr/Input';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useRef, useState, type FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { useDebounce } from 'use-debounce';
import { z } from 'zod';

import { Mandatory } from '@/components/shared/Mandatory';
import { toFullName } from '@/utils/user.utils';
import {
  useCreateObservationMutation,
  useListObservationsAttachments,
  useSearchMagistratsQuery,
  useUpdateObservationMutation,
  type MagistratSearchResult,
  type Observation,
} from '@queries/observations.queries';

const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.pdf,.doc,.docx';

const observationFormSchema = z.object({
  magistratId: z.string().min(1, 'Champ obligatoire'),
  dateReception: z.string().min(1, 'Champ obligatoire'),
  description: z.string().optional(),
  files: z.array(z.instanceof(File)).optional(),
  linkedFiles: z
    .array(z.object({ observationId: z.string(), fileId: z.string(), name: z.string() }))
    .optional(),
});

type FormSchema = z.infer<typeof observationFormSchema>;

export const ObservationForm: FC<{
  sessionId: string;
  nominationFileId: string;
  nominationFileName: string;
  observation?: Observation;
  onSuccess?: () => void;
  onPending: (isPending: boolean) => unknown;
}> = ({ sessionId, nominationFileId, observation, onSuccess, onPending }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!observation;

  const {
    control,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: {
      magistratId: observation?.magistrat?.id ?? '',
      dateReception: observation?.dateReception?.split('T')[0] ?? '',
      description: observation?.description,
      files: [],
      linkedFiles: [],
    },
    mode: 'onChange',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 400);
  const [selectedMagistrat, setSelectedMagistrat] = useState<MagistratSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [existingFiles, setExistingFiles] = useState<Observation['files']>(observation?.files ?? []);
  const [filesToDetach, setFilesToDetach] = useState<string[]>([]);

  const { data: displayedMagistrats, isLoading: isSearching } = useSearchMagistratsQuery(debouncedSearch);
  const { data: observationsAttachments } = useListObservationsAttachments({
    sessionId,
    excludeObservationId: observation?.id,
    magistratId: selectedMagistrat?.id,
  });

  const {
    mutate: createObservation,
    reset: resetCreateMutation,
    error: createError,
  } = useCreateObservationMutation();
  const {
    mutate: updateObservation,
    reset: resetUpdateMutation,
    error: updateError,
  } = useUpdateObservationMutation();

  const files = watch('files') ?? [];

  useEffect(() => {
    if (observation?.magistrat) {
      setSelectedMagistrat({
        id: observation.magistrat.id,
        firstName: observation.magistrat.firstName,
        lastName: observation.magistrat.lastName,
        usedName: '',
        grade: null,
        currentPosition: observation.magistrat.currentPosition ?? null,
      });
      setSearchTerm(`${observation.magistrat.lastName} ${observation.magistrat.firstName}`);
    }
  }, [observation]);

  const handleRemoveExistingFile = (fileId: string) => {
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
    setFilesToDetach((prev) => [...prev, fileId]);
  };

  const resetForm = () => {
    reset();
    setSearchTerm('');
    setSelectedMagistrat(null);
    setShowResults(false);
    setExistingFiles([]);
    setFilesToDetach([]);
    resetCreateMutation();
    resetUpdateMutation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: FormSchema) => {
    onPending(true);
    if (isEditing) {
      updateObservation(
        {
          sessionId,
          observationId: observation.id,
          nominationFileId,
          magistratId: data.magistratId,
          dateReception: data.dateReception,
          description: data.description,
          files: data.files,
          detachFileIds: filesToDetach,
          linkedObservationsAttachments: (data.linkedFiles ?? []).map(({ observationId, fileId }) => ({
            observationId,
            fileId,
          })),
        },
        {
          onSettled() {
            onPending(false);
          },
          onSuccess: () => {
            resetForm();
            onSuccess?.();
          },
        },
      );
    } else {
      createObservation(
        {
          sessionId,
          nominationFileId,
          magistratId: data.magistratId,
          dateReception: data.dateReception,
          description: data.description,
          files: data.files ?? [],
          linkedObservationsAttachments: (data.linkedFiles ?? []).map(({ observationId, fileId }) => ({
            observationId,
            fileId,
          })),
        },
        {
          onSettled() {
            onPending(false);
          },
          onSuccess: () => {
            resetForm();
            onSuccess?.();
          },
        },
      );
    }
  };

  const handleMagistratSelect = (magistrat: MagistratSearchResult) => {
    setSelectedMagistrat(magistrat);
    setValue('magistratId', magistrat.id);
    setSearchTerm(`${magistrat.lastName} ${magistrat.firstName}`);
    setShowResults(false);
  };

  const handleMagistratClear = () => {
    setSelectedMagistrat(null);
    setValue('magistratId', '');
    setSearchTerm('');
  };

  const linkedFiles = watch('linkedFiles');
  const viewObservationAttachments = React.useMemo(() => {
    return ([] as { observationId: string; fileId: string; name: string }[]).concat(
      observationsAttachments?.items ?? [],
      (linkedFiles ?? []).filter((value) => {
        const items = observationsAttachments?.items ?? [];
        return !items.some(
          (item) => item.observationId === value.observationId && item.fileId === value.fileId,
        );
      }),
    );
  }, [linkedFiles, observationsAttachments]);

  const onLinkFileClicked = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      const fileId = e.currentTarget.dataset.fileId;
      const observationId = e.currentTarget.dataset.observationId;
      const name = e.currentTarget.dataset.name;

      if (!fileId || !observationId || !name) return;

      const current = getValues('linkedFiles') ?? [];
      const isPressed = e.currentTarget.getAttribute('aria-pressed') !== 'false';
      if (isPressed) {
        setValue('linkedFiles', current.concat({ fileId, observationId, name }));
      } else {
        setValue(
          'linkedFiles',
          current.filter((x) => x.fileId !== fileId && x.observationId !== observationId),
        );
      }
    },
    [getValues, setValue],
  );

  return (
    <form id="observation-form" onSubmit={handleFormSubmit(onSubmit)} className="flex flex-col gap-6">
      {createError || updateError ? (
        <p className="mb-0 text-red-600">
          {createError?.message ||
            updateError?.message ||
            (isEditing ? `Erreur pendant la mise à jour` : `Erreur à la création`)}
        </p>
      ) : null}
      <Controller
        name="dateReception"
        control={control}
        render={({ field }) => (
          <Input
            label={
              <Mandatory>
                <FormattedMessage defaultMessage="Date de réception" />
              </Mandatory>
            }
            state={errors.dateReception || updateError || createError ? 'error' : 'default'}
            stateRelatedMessage={errors.dateReception?.message}
            classes={{ root: '!mb-0' }}
            nativeInputProps={{
              type: 'date',
              value: field.value,
              onChange: field.onChange,
              required: true,
            }}
          />
        )}
      />

      <div className="relative">
        <Input
          label={
            <Mandatory>
              <FormattedMessage defaultMessage="Magistrat observant" />
            </Mandatory>
          }
          classes={{ root: '!mb-0' }}
          iconId="fr-icon-search-line"
          hintText="Nom, Prénom ou Adresse email pro"
          state={errors.magistratId || updateError || createError ? 'error' : 'default'}
          stateRelatedMessage={errors.magistratId ? errors.magistratId.message : null}
          nativeInputProps={{
            type: 'search',
            role: 'combobox',
            value: searchTerm,
            onFocus: () => setShowResults(true),
            placeholder: 'Rechercher un magistrat',
            'aria-expanded': showResults && debouncedSearch.length >= 2,
            'aria-controls': 'magistrat-listbox',
            'aria-autocomplete': 'list',
            onChange: (e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
              if (e.target.value === '') {
                setSelectedMagistrat(null);
                setValue('magistratId', '');
              }
            },
          }}
        />
        {showResults && debouncedSearch.length >= 2 && (
          <div
            id="magistrat-listbox"
            role="listbox"
            className="absolute mt-1 max-h-60 w-full overflow-y-auto rounded border bg-white shadow-lg"
            style={{ zIndex: 9999 }}
          >
            {isSearching ? (
              <div className="p-3 text-sm text-gray-500">Recherche...</div>
            ) : (displayedMagistrats ?? []).length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Aucun résultat</div>
            ) : (
              (displayedMagistrats ?? []).map((magistrat) => (
                <button
                  key={magistrat.id}
                  type="button"
                  role="option"
                  aria-selected={selectedMagistrat?.id === magistrat.id}
                  className="w-full cursor-pointer border-b p-3 text-left hover:bg-gray-100"
                  onClick={() => handleMagistratSelect(magistrat)}
                >
                  <div className="font-medium">{toFullName(magistrat)}</div>
                  <div className="text-xs text-gray-500">
                    {[magistrat.grade, magistrat.currentPosition]
                      .flatMap((x) => {
                        const trimmed = x?.trim();
                        return trimmed ? [trimmed] : [];
                      })
                      .join(' - ')}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        {selectedMagistrat && (
          <div className="mt-2 flex items-center gap-2 p-2">
            <Tag dismissible nativeButtonProps={{ onClick: handleMagistratClear }} as="button">
              {toFullName(selectedMagistrat)}
              {selectedMagistrat.currentPosition && ` - ${selectedMagistrat.currentPosition}`}
            </Tag>
          </div>
        )}
      </div>

      {isEditing && existingFiles.length > 0 && (
        <div>
          <label className="fr-label mb-2 block">
            <FormattedMessage
              values={{ count: existingFiles.length }}
              defaultMessage={`{count, plural,
                one {Fichier existant}  
                other {Fichiers existants}  
              }`}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {existingFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-2 rounded bg-gray-100 px-3 py-2">
                <i className="ri-file-line" />
                <span className="text-sm">{file.name}</span>
                <button
                  type="button"
                  className="ml-2 text-red-600 hover:text-red-800"
                  onClick={() => handleRemoveExistingFile(file.id)}
                  title="Supprimer ce fichier"
                >
                  <i className="ri-close-line" />
                </button>
              </div>
            ))}
          </div>
          {filesToDetach.length > 0 && (
            <div className="mt-2 text-sm text-orange-600">
              {filesToDetach.length > 1
                ? `${filesToDetach.length} fichiers seront supprimés`
                : `1 fichier sera supprimé`}
            </div>
          )}
        </div>
      )}

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Input
            textArea
            classes={{ root: '!mb-0' }}
            label="Historique observant"
            nativeTextAreaProps={{ value: field.value as string, onChange: field.onChange }}
          />
        )}
      />

      <Controller
        name="files"
        control={control}
        render={({ field }) => (
          <Upload
            label={isEditing ? 'Ajouter des fichiers' : 'Pièces jointes'}
            hint="Formats acceptés: JPEG, PNG, PDF, Word"
            nativeInputProps={{
              ref: fileInputRef,
              multiple: true,
              accept: ACCEPTED_FILE_TYPES,
              onChange: (e) => {
                if (e.target.files) {
                  field.onChange(Array.from(e.target.files));
                }
              },
            }}
          />
        )}
      />
      {files.length > 0 && (
        <div className="text-sm text-gray-600">
          <FormattedMessage
            values={{ count: files.length }}
            defaultMessage={`{count, plural,
              one {{count} nouveau fichier sélectionné}
              other {{count} nouveaux fichiers sélectionnés}
            }`}
          />
        </div>
      )}

      <Controller
        name="linkedFiles"
        control={control}
        render={({ field }) => (
          <ul className="m-0 flex list-none flex-row flex-wrap gap-x-2 p-0">
            <li></li>
            {viewObservationAttachments.map((item) => (
              <li key={`${item.observationId}_${item.fileId}`}>
                <Tag
                  small
                  title={`Lier "${item.name}"`}
                  iconId="fr-icon-file-fill"
                  nativeButtonProps={{
                    onClick: onLinkFileClicked,
                    'data-name': item.name,
                    'data-file-id': item.fileId,
                    'data-observation-id': item.observationId,
                  }}
                  pressed={field.value?.some(
                    (x) => x.observationId === item.observationId && x.fileId === item.fileId,
                  )}
                >
                  {item.name}
                </Tag>
              </li>
            ))}
          </ul>
        )}
      />
    </form>
  );
};
