import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';
import { z } from 'zod';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { RequiredLabel } from '@/shared/ui/required-label';
import { Upload } from '@/shared/ui/upload';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { IngestedLolfiArchiveDto } from '@api/types';
import { useIngestLolfiArchiveMutation } from '@queries/ingest.queries';

const ZIP_MIME_TYPES = ['application/zip', 'application/x-zip-compressed'];
const ZIP_FILE_TYPES = [...ZIP_MIME_TYPES, '.zip'].join(',');

type FormSchema = { archive: File };

function useIngestLolfiArchiveSchema() {
  const { formatMessage } = useIntl();

  return useMemo(() => {
    const mandatoryField = formatMessage({ defaultMessage: 'Champ obligatoire.' });

    return z.object({
      archive: z
        .instanceof(File, { message: mandatoryField })
        .refine((file) => file.size > 0, { message: mandatoryField })
        .refine((file) => ZIP_MIME_TYPES.includes(file.type), {
          message: formatMessage({ defaultMessage: 'Veuillez importer un fichier au bon format (.zip).' }),
        }),
    }) satisfies z.ZodType<FormSchema>;
  }, [formatMessage]);
}

export function IngestLolfiArchivePage() {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const schema = useIngestLolfiArchiveSchema();
  const [asyncErrors, setAsyncErrors] = useState<string[] | null>(null);
  /** the shared upload keeps no value: a new key is the only way to empty the picker */
  const [uploadKey, setUploadKey] = useState(0);

  const { mutate: ingestArchive, reset: resetMutation, isPending } = useIngestLolfiArchiveMutation();

  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<FormSchema>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormSchema> = useCallback(
    (dto) => {
      resetMutation();
      ingestArchive(
        { archive: dto.archive },
        {
          async onError(error) {
            const defaultError = formatMessage({
              defaultMessage: "L'ingestion de l'archive a échoué. Veuillez réessayer.",
            });

            if (!(error instanceof HttpException)) {
              setAsyncErrors([defaultError]);
              return;
            }

            const body = (await error.response.json().catch(() => null)) as IngestedLolfiArchiveDto | null;
            if (!body) {
              setAsyncErrors([defaultError]);
              return;
            }

            setAsyncErrors(body.errors ? body.errors.map(({ message }) => message) : null);
          },
          onSettled() {
            setUploadKey((key) => key + 1);
          },
          onSuccess: (data) => {
            if (data?.id) {
              return navigate(generatePath(ROUTE_PATHS.ADMIN.DETAILS_JOB, { jobId: String(data.id) }));
            }
          },
        },
      );
    },
    [formatMessage, ingestArchive, navigate, resetMutation],
  );

  return (
    <div className="fr-container fr-pt-8v fr-pb-16v">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Importer une archive LOLFI' }),
          segments: [{ label: formatMessage({ defaultMessage: 'Administration' }), to: {} }],
        }}
        id="administration-breadcrumb"
      />

      <h1 className="fr-h3">
        <FormattedMessage defaultMessage="Importer une archive LOLFI" />
      </h1>

      {asyncErrors && asyncErrors.length > 0 && (
        <Alert
          className="fr-mb-6v max-w-2xl"
          closable
          description={
            <ul>
              {asyncErrors.map((error, i) => (
                <li key={`error_${i}`}>{error}</li>
              ))}
            </ul>
          }
          onClose={() => resetMutation()}
          severity="error"
          title={formatMessage({ defaultMessage: "Erreur lors de l'ingestion" })}
        />
      )}

      <form className="max-w-2xl" onSubmit={handleSubmit(onSubmit)}>
        <Controller<FormSchema, 'archive'>
          control={control}
          name="archive"
          render={({ field: { onChange } }) => (
            <>
              <Upload
                accept={ZIP_FILE_TYPES}
                hasError={!!errors.archive || !!asyncErrors}
                hint={formatMessage({ defaultMessage: 'Format supporté : zip' })}
                key={uploadKey}
                label={
                  <RequiredLabel>
                    <FormattedMessage defaultMessage="Archive LOLFI" />
                  </RequiredLabel>
                }
                onChange={([file]) => {
                  if (!file) return;
                  resetMutation();
                  onChange(file);
                }}
              />
              {errors.archive && (
                <p className="fr-error-text" role="alert">
                  {errors.archive.message}
                </p>
              )}
            </>
          )}
        />

        <Button className="fr-mt-8v" disabled={isPending || !isValid} priority="primary" type="submit">
          <FormattedMessage defaultMessage="Enregistrer" />
        </Button>
      </form>
    </div>
  );
}
