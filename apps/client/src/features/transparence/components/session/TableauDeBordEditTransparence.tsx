import Alert from '@codegouvfr/react-dsfr/Alert';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
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
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const { user } = useUser();

  const { session } = props;
  const { mutateAsync: updateNominationSessionAsync } = useUpdateNominationSessionMutation();
  const { mutate: validateSession } = useValidateSessionMutation();

  const invalidDate = formatMessage({ defaultMessage: 'Format de date invalide' });

  const {
    control,
    formState: { errors },
    handleSubmit,
    setError,
  } = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().nonempty(),
        date: z.iso.date(invalidDate),
        observationsClosingDate: z.iso.date(invalidDate),
        dueDate: z.iso.date(invalidDate).nullable(),
        positionStartDate: z.iso.date(invalidDate).nullable(),
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
          setError(`root`, {
            message: formatMessage({ defaultMessage: 'Erreur lors de la modification de la transparence' }),
          });
        },
      },
    );
  };

  return (
    <form className="m-auto w-full max-w-120" onSubmit={handleSubmit(onSubmit)}>
      <h1>
        <FormattedMessage defaultMessage='Éditer "{name}"' values={{ name: session.name }} />
      </h1>
      {errors.root && (
        <Alert className="fr-mb-2v" description="" severity="error" small title={errors.root.message} />
      )}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value, ...field } }) => (
          <Input
            className="w-full"
            id="nom-transparence"
            label={
              <>
                <FormattedMessage defaultMessage="Nom de la transparence" />
                <span className="text-(--text-default-error)">*</span>
              </>
            }
            nativeInputProps={{
              autoFocus: true,
              onChange,
              value,
              ...field,
              placeholder: formatMessage({ defaultMessage: 'Nom de la transparence' }),
            }}
            state={errors.name ? 'error' : 'default'}
            stateRelatedMessage={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value, ...field } }) => (
          <Input
            className="w-full"
            id="date-transparence"
            label={
              <>
                <FormattedMessage defaultMessage="Date de la transparence" />
                <span className="text-(--text-default-error)">*</span>
              </>
            }
            nativeInputProps={{
              onChange,
              type: 'date',
              value,
              ...field,
            }}
            state={errors.date ? 'error' : 'default'}
            stateRelatedMessage={errors.date?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="observationsClosingDate"
        render={({ field: { onChange, value, ...field } }) => (
          <Input
            className="w-full"
            id="date-cloture-delai-observation"
            label={
              <>
                <FormattedMessage defaultMessage="Clôture du délai d'observation" />
                <span className="text-(--text-default-error)">*</span>
              </>
            }
            nativeInputProps={{
              onChange,
              type: 'date',
              value,
              ...field,
            }}
            state={errors.observationsClosingDate ? 'error' : 'default'}
            stateRelatedMessage={errors.observationsClosingDate?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="dueDate"
        render={({ field: { onChange, value, ...field } }) => (
          <Input
            className="w-full"
            id="date-echeance"
            label={<FormattedMessage defaultMessage="Date d'échéance" />}
            nativeInputProps={{
              onChange,
              type: 'date',
              value: value ?? undefined,
              ...field,
            }}
            state={errors.dueDate ? 'error' : 'default'}
            stateRelatedMessage={errors.dueDate?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="positionStartDate"
        render={({ field: { onChange, value, ...field } }) => (
          <Input
            className="w-full"
            id="date-prise-de-poste"
            label={<FormattedMessage defaultMessage="Date de prise de poste" />}
            nativeInputProps={{
              onChange,
              type: 'date',
              value: value ?? undefined,
              ...field,
            }}
            state={errors.positionStartDate ? 'error' : 'default'}
            stateRelatedMessage={errors.positionStartDate?.message}
          />
        )}
      />
      <ButtonsGroup
        buttons={[
          {
            children: formatMessage({ defaultMessage: 'Annuler' }),
            id: 'annuler',
            linkProps: { to: generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: session.id }) },
            priority: 'tertiary',
          },
          {
            children: formatMessage({ defaultMessage: 'Enregistrer' }),
            id: 'enregistrer',
            type: 'submit',
          },
        ]}
        inlineLayoutWhen="always"
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
