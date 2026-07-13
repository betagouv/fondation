import { Input } from '@codegouvfr/react-dsfr/Input';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { Mandatory } from '@/shared/ui/Mandatory';
import {
  useCreateObservationMutation,
  useListObservationsAttachments,
  useUpdateObservationMutation,
  type MagistratSearchResult,
  type Observation,
} from '@queries/observations.queries';

import { MagistratCombobox } from './MagistratCombobox';
import { ObservationExistingFiles } from './ObservationExistingFiles';
import { ObservationLinkableAttachments } from './ObservationLinkableAttachments';

const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.pdf,.doc,.docx';

const observationFormSchema = z
  .object({
    magistratId: z.string().min(1, 'Champ obligatoire'),
    dateReception: z.string().min(1, 'Champ obligatoire'),
    description: z.string().optional(),
    files: z.array(z.instanceof(File)).optional(),
    linkedFiles: z
      .array(z.object({ observationId: z.string(), fileId: z.string(), name: z.string() }))
      .optional(),
    keptFileIds: z.array(z.string()).optional(),
  })
  .superRefine((values, ctx) => {
    const hasContent =
      !!values.description?.trim() ||
      !!values.files?.length ||
      !!values.linkedFiles?.length ||
      !!values.keptFileIds?.length;

    if (!hasContent) {
      ctx.addIssue({
        code: 'custom',
        path: ['description'],
        message: "Renseignez l'historique observant ou joignez une pièce jointe",
      });
    }
  });

type FormSchema = z.infer<typeof observationFormSchema>;

export function ObservationForm({
  nominationFileId,
  observation,
  onPending,
  onSuccess,
  sessionId,
}: {
  nominationFileId: string;
  observation?: Observation;
  onPending: (isPending: boolean) => unknown;
  onSuccess?: () => void;
  sessionId: string;
}) {
  const intl = useIntl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!observation;

  const {
    control,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
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
      keptFileIds: observation?.files.map(({ id }) => id) ?? [],
    },
    mode: 'onChange',
  });

  const [selectedMagistrat, setSelectedMagistrat] = useState<MagistratSearchResult | null>(null);

  const keptFileIds = watch('keptFileIds') ?? [];
  const attachedFiles = observation?.files ?? [];
  const existingFiles = attachedFiles.filter(({ id }) => keptFileIds.includes(id));
  const filesToDetach = attachedFiles.filter(({ id }) => !keptFileIds.includes(id));

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
    }
  }, [observation]);

  const handleMagistratChange = (magistrat: MagistratSearchResult | null) => {
    setSelectedMagistrat(magistrat);
    setValue('magistratId', magistrat?.id ?? '', { shouldValidate: true });
  };

  const handleRemoveExistingFile = (fileId: string) => {
    setValue(
      'keptFileIds',
      keptFileIds.filter((id) => id !== fileId),
      { shouldValidate: true },
    );
  };

  const resetForm = () => {
    reset();
    setSelectedMagistrat(null);
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
          detachFileIds: filesToDetach.map(({ id }) => id),
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

  const linkedFiles = watch('linkedFiles') ?? [];
  const searchedAttachments = observationsAttachments?.items ?? [];
  const linkableAttachments = [
    ...searchedAttachments,
    ...linkedFiles.filter(
      (linked) =>
        !searchedAttachments.some(
          (attachment) =>
            attachment.observationId === linked.observationId && attachment.fileId === linked.fileId,
        ),
    ),
  ];

  return (
    <form className="flex flex-col gap-6" id="observation-form" onSubmit={handleFormSubmit(onSubmit)}>
      {createError || updateError ? (
        <p className="fr-mb-0 text-(--text-default-error)">
          {createError?.message ||
            updateError?.message ||
            (isEditing ? (
              <FormattedMessage defaultMessage="Erreur pendant la mise à jour" />
            ) : (
              <FormattedMessage defaultMessage="Erreur à la création" />
            ))}
        </p>
      ) : null}
      <MagistratCombobox
        errorMessage={errors.magistratId?.message}
        magistrat={selectedMagistrat}
        onChange={handleMagistratChange}
      />

      <Controller
        control={control}
        name="dateReception"
        render={({ field }) => (
          <Input
            classes={{ root: 'fr-mb-0' }}
            label={
              <Mandatory>
                <FormattedMessage defaultMessage="Date de réception" />
              </Mandatory>
            }
            nativeInputProps={{
              'aria-required': true,
              onChange: field.onChange,
              type: 'date',
              value: field.value,
            }}
            state={errors.dateReception ? 'error' : 'default'}
            stateRelatedMessage={errors.dateReception?.message}
          />
        )}
      />

      {isEditing && existingFiles.length > 0 && (
        <ObservationExistingFiles
          detachedFiles={filesToDetach}
          files={existingFiles}
          onRemove={handleRemoveExistingFile}
        />
      )}

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <Input
            classes={{ root: 'fr-mb-0' }}
            hintText={intl.formatMessage({
              defaultMessage: "Renseignez le texte de l'observation ou joignez une pièce jointe ci-dessous",
            })}
            label={<FormattedMessage defaultMessage="Historique observant" />}
            nativeTextAreaProps={{ onChange: field.onChange, value: field.value as string }}
            state={errors.description ? 'error' : 'default'}
            stateRelatedMessage={errors.description?.message}
            textArea
          />
        )}
      />

      <Controller
        control={control}
        name="files"
        render={({ field }) => (
          <Upload
            hint={intl.formatMessage({ defaultMessage: 'Formats acceptés : JPEG, PNG, PDF, Word' })}
            label={
              isEditing ? (
                <FormattedMessage defaultMessage="Ajouter des fichiers" />
              ) : (
                <FormattedMessage defaultMessage="Pièces jointes" />
              )
            }
            nativeInputProps={{
              accept: ACCEPTED_FILE_TYPES,
              multiple: true,
              onChange: (e) => {
                if (e.target.files) {
                  field.onChange(Array.from(e.target.files));
                }
              },
              ref: fileInputRef,
            }}
          />
        )}
      />
      {files.length > 0 && (
        <div className="text-sm text-(--text-mention-grey)">
          <FormattedMessage
            defaultMessage={`{count, plural,
              one {{count} nouveau fichier sélectionné}
              other {{count} nouveaux fichiers sélectionnés}
            }`}
            values={{ count: files.length }}
          />
        </div>
      )}

      <Controller
        control={control}
        name="linkedFiles"
        render={({ field }) => (
          <ObservationLinkableAttachments
            attachments={linkableAttachments}
            linked={field.value ?? []}
            onToggle={field.onChange}
          />
        )}
      />
    </form>
  );
}
