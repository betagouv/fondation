import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useRef, useState, type FC } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { generatePath, useNavigate } from 'react-router';
import { z } from 'zod';

import { PageContentLayout } from '@/components/shared/PageContentLayout';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { IngestedLolfiArchiveDto } from '@api/types';
import { useIngestLolfiArchiveMutation } from '@queries/ingest.queries';

const mandatoryField = 'Champ obligatoire.';

const ingestLolfiArchiveSchema = z.object({
  archive: z
    .instanceof(File, { message: mandatoryField })
    .refine((file) => file.size > 0, { message: mandatoryField })
    .refine(
      (file) => {
        const validTypes = ['application/zip', 'application/x-zip-compressed'];
        return validTypes.includes(file.type);
      },
      { message: 'Veuillez importer un fichier au bon format (.zip).' },
    ),
});

type FormSchema = z.infer<typeof ingestLolfiArchiveSchema>;

export const IngestLolfiArchivePage: FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const [asyncErrors, setAsyncErrors] = useState<string[] | null>(null);

  const {
    mutateAsync: ingestArchiveAsync,
    reset: resetMutation,
    isPending,
  } = useIngestLolfiArchiveMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormSchema>({
    resolver: zodResolver(ingestLolfiArchiveSchema),
  });

  const onSubmit: SubmitHandler<FormSchema> = useCallback(
    (dto) => {
      resetMutation();
      return ingestArchiveAsync(
        { archive: dto.archive },
        {
          async onError(error) {
            if (!(error instanceof HttpException)) {
              setAsyncErrors([`Erreur: ${String(error)}`]);
              return;
            }

            const { errors } = (await error.response.json()) as IngestedLolfiArchiveDto;
            setAsyncErrors(errors ? errors.map(({ message }) => message) : null);
          },
          onSuccess: (data) => {
            if (data?.id) {
              return navigate(generatePath(ROUTE_PATHS.ADMIN.DETAILS_JOB, { jobId: String(data.id) }));
            }
          },
          onSettled() {
            if (inputRef.current) {
              inputRef.current.value = '';
              inputRef.current.files = null;
            }
          },
        },
      );
    },
    [resetMutation, ingestArchiveAsync, navigate],
  );

  return (
    <PageContentLayout>
      <h1 className="fr-h2">Ingérer une archive LOLFI</h1>

      {asyncErrors && asyncErrors.length > 0 && (
        <Alert
          severity="error"
          title="Erreur lors de l'ingestion"
          description={
            <ul>
              {asyncErrors.map((error, i) => (
                <li key={`error_${i}`}>{error}</li>
              ))}
            </ul>
          }
          closable
          onClose={() => resetMutation()}
        />
      )}

      <form className="m-auto max-w-[480px]">
        <Controller<FormSchema, 'archive'>
          name="archive"
          control={control}
          render={({ field: { onChange } }) => (
            <Upload
              id="lolfi-archive-upload"
              nativeInputProps={{
                type: 'file',
                ref: inputRef,
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    resetMutation();
                    onChange(file);
                  }
                },
              }}
              hint="Format supporté : .zip"
              label={
                <>
                  Archive LOLFI<span className="text-red-500">*</span>
                </>
              }
              state={errors.archive || asyncErrors ? 'error' : 'default'}
              stateRelatedMessage={errors.archive?.message}
            />
          )}
        />

        <Button
          priority="primary"
          className="mt-6"
          onClick={handleSubmit(onSubmit)}
          disabled={isPending || !isValid}
          type="submit"
        >
          Enregistrer
        </Button>
      </form>
    </PageContentLayout>
  );
};
