import Alert from '@codegouvfr/react-dsfr/Alert';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';
import { generatePath, useNavigate, useParams } from 'react-router';
import { z } from 'zod';

import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import { dateOnlyToDate } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';
import { useUser } from '@queries/auth.queries';
import {
  useDetailedNominationSessionQuery,
  useUpdateNominationSessionMutation,
  useValidateSessionMutation,
} from '@queries/nomination-sessions.queries';

function TableauDeBordEditTransparence(props: { session: DetailedNominationSessionDto }) {
  const navigate = useNavigate();

  const { user } = useUser();

  const { session } = props;
  const { mutateAsync: updateNominationSessionAsync } = useUpdateNominationSessionMutation();
  const { mutate: validateSession } = useValidateSessionMutation();

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().nonempty(),
        date: z.iso.date('Format de date invalide'),
        observationsClosingDate: z.iso.date('Format de date invalide'),
        dueDate: z.iso.date('Format de date invalide').nullable(),
        positionStartDate: z.iso.date('Format de date invalide').nullable(),
      }),
    ),
    defaultValues: {
      name: session?.name ?? '',
      date: session?.date ? format(dateOnlyToDate(session.date), 'yyyy-MM-dd') : '',
      observationsClosingDate: session?.observationsClosingDate
        ? format(dateOnlyToDate(session.observationsClosingDate), 'yyyy-MM-dd')
        : '',
      dueDate: session?.dueDate ? format(dateOnlyToDate(session.dueDate), 'yyyy-MM-dd') : null,
      positionStartDate: session?.positionStartDate
        ? format(dateOnlyToDate(session.positionStartDate), 'yyyy-MM-dd')
        : null,
    },
  });

  const onSubmit = async (data: {
    name: string;
    date: string;
    observationsClosingDate: string;
    dueDate: string | null;
    positionStartDate: string | null;
  }) => {
    await updateNominationSessionAsync(
      { sessionId: session.id, data },
      {
        onSuccess: () => {
          if (session.isValidated || !user) {
            return navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: session.id }));
          }

          validateSession(
            { userId: user.id, sessionId: session.id },
            {
              onSettled: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: session.id })),
            },
          );
        },
        onError: () => {
          setError(`root`, { message: 'Erreur lors de la modification de la transparence' });
        },
      },
    );
  };

  return (
    <form className="m-auto w-full max-w-120" onSubmit={handleSubmit(onSubmit)}>
      {session ? <h1>Éditer "{session?.name}"</h1> : <h1>Éditer la transparence</h1>}
      {errors.root && (
        <Alert className="fr-mb-2v" severity="error" title={errors.root.message} small description="" />
      )}

      <Controller
        name="name"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label={
              <>
                Nom de la transparence<span className="text-(--text-default-error)">*</span>
              </>
            }
            id="nom-transparence"
            nativeInputProps={{
              value,
              onChange,
              autoFocus: true,
              ...field,
              placeholder: 'Nom de la transparence',
            }}
            state={errors.name ? 'error' : 'default'}
            stateRelatedMessage={errors.name?.message}
          />
        )}
      />
      <Controller
        name="date"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label={
              <>
                Date de la transparence<span className="text-(--text-default-error)">*</span>
              </>
            }
            id="date-transparence"
            nativeInputProps={{
              type: 'date',
              value,
              onChange,
              ...field,
            }}
            state={errors.date ? 'error' : 'default'}
            stateRelatedMessage={errors.date?.message}
          />
        )}
      />

      <Controller
        name="observationsClosingDate"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label={
              <>
                Clôture du délai d'observation<span className="text-(--text-default-error)">*</span>
              </>
            }
            id="date-cloture-delai-observation"
            nativeInputProps={{
              type: 'date',
              value,
              onChange,
              ...field,
            }}
            state={errors.observationsClosingDate ? 'error' : 'default'}
            stateRelatedMessage={errors.observationsClosingDate?.message}
          />
        )}
      />
      <Controller
        name="dueDate"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label="Date d'échéance"
            id="date-echeance"
            nativeInputProps={{
              type: 'date',
              value: value ?? undefined,
              onChange,
              ...field,
            }}
            state={errors.dueDate ? 'error' : 'default'}
            stateRelatedMessage={errors.dueDate?.message}
          />
        )}
      />
      <Controller
        name="positionStartDate"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label="Date de prise de poste"
            id="date-prise-de-poste"
            nativeInputProps={{
              type: 'date',
              value: value ?? undefined,
              onChange,
              ...field,
            }}
            state={errors.positionStartDate ? 'error' : 'default'}
            stateRelatedMessage={errors.positionStartDate?.message}
          />
        )}
      />
      <ButtonsGroup
        inlineLayoutWhen="always"
        buttons={[
          {
            id: 'annuler',
            children: 'Annuler',
            priority: 'tertiary',
            linkProps: { to: generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: session.id }) },
          },
          {
            id: 'enregistrer',
            children: 'Enregistrer',
            type: 'submit',
          },
        ]}
      />
    </form>
  );
}

export function TableauDeBordEditTransparencePage() {
  const { sessionId } = useParams();
  const { data: session } = useDetailedNominationSessionQuery({ sessionId });

  return (
    <PageContentLayout>{session && <TableauDeBordEditTransparence session={session} />}</PageContentLayout>
  );
}
