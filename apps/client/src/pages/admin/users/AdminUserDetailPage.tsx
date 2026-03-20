import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import React from 'react';
import { useNavigate, useParams } from 'react-router';

import type { DetailedAdminUserDto } from '@api/types';
import {
  useAdminUserDetailQuery,
  useUpdateUserDisplayTitleMutation,
  useUpdateUserDutyMutation,
  useUpdateUserEmailMutation,
  useUpdateUserPasswordMutation,
  useUpdateUserRoleMutation,
  useUpdateUserTitleMutation
} from '@queries/administration.queries';
import { useLogout, useUser } from '@queries/auth.queries';

import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { RoleEnumLabels, type RoleEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { toFullName } from '@/utils/user.utils';
import {
  ROLE_OPTIONS,
  USER_DUTY_ENUM_OPTIONS,
  USER_TITLE_ENUM_OPTIONS,
  UserDutyEnumLabels,
  UserTitleEnumLabels,
  type UserDutyEnum,
  type UserTitleEnum
} from './admin-user-enum';

function EmailField(props: { user: DetailedAdminUserDto }) {
  const [isEditing, setEditing] = React.useState(false);
  const [email, setEmail] = React.useState(props.user.email);
  const { mutate, isPending, error } = useUpdateUserEmailMutation(props.user.id);

  const formError = React.useMemo(
    () => (email.trim().length === 0 ? `Champ obligatoire` : undefined),
    [email]
  );

  const handleEdit = React.useCallback(() => {
    setEmail(props.user.email);
    setEditing(true);
  }, [setEmail, setEditing, props]);

  const handleSave = () => {
    const trimmed = email.trim();
    if (trimmed === props.user.email) {
      setEditing(false);
      return;
    }
    mutate({ email: trimmed }, { onSuccess: () => setEditing(false) });
  };

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Email</dt>
        {isEditing ? (
          <div className="flex gap-1">
            <Button
              size="small"
              disabled={isPending}
              onClick={() => setEditing(false)}
              type="button"
              priority="tertiary no outline"
              iconId="fr-icon-close-line"
            >
              Fermer
            </Button>
            <Button
              size="small"
              disabled={isPending}
              onClick={handleSave}
              type="button"
              priority="primary"
              iconId="ri-check-line"
            >
              Ok
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleEdit}
            disabled={isPending}
            title="Éditer l'email"
            priority="tertiary no outline"
            size="small"
            className="rounded-full"
            iconId="fr-icon-edit-fill"
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <Input
            label="Email"
            hideLabel
            state={formError || error ? 'error' : undefined}
            stateRelatedMessage={formError ?? (error ? "Erreur à la mise à jour de l'email" : undefined)}
            nativeInputProps={{
              type: 'email',
              autoFocus: true,
              autoComplete: 'off',
              value: email,
              onChange: (e) => setEmail(e.target.value)
            }}
          />
        </form>
      ) : (
        <dd className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">{props.user.email}</dd>
      )}
    </div>
  );
}

function PasswordField(props: { user: DetailedAdminUserDto }) {
  const confirmation = useConfirmation();
  const [isEditing, setEditing] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const { mutate: updatePassword, isPending, error, reset } = useUpdateUserPasswordMutation(props.user.id);

  const [isDirty, setIsDirty] = React.useState<boolean>(false);
  const formError = React.useMemo(
    () => (isDirty && password.trim().length === 0 ? `Champ obligatoire` : undefined),
    [isDirty, password]
  );

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isDirty) setIsDirty(true);
      const value = e.target.value;
      setPassword(value);
    },
    [isDirty, setIsDirty, setPassword]
  );

  const changeEdition = React.useCallback(
    (edition: boolean) => {
      setPassword('');
      setIsDirty(false);
      setEditing(edition);
    },
    [setIsDirty, setEditing]
  );

  const handleSave = React.useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault();

      const trimmed = password.trim();
      if (!trimmed) return;
      updatePassword(
        { password: trimmed },
        {
          onSuccess: async () => {
            changeEdition(false);

            const fullName = toFullName(props.user);
            const { isConfirmed } = await confirmation.waitForConfirmation({
              title: `Notifier l'utilisateur de son nouveau mot de passe ?`,
              i18n: { confirm: `Notifier ${fullName}` },
              content: (
                <p>
                  Le mot de passe de <em>{fullName}</em> a été mis à jour. Voulez-vous{' '}
                  {props.user.gender === 'MALE' ? 'le' : 'la'} notifier par mail&nbsp;?
                </p>
              )
            });

            if (isConfirmed) {
              const subject = `Mot de passe FONDATION mis à jour`;
              const content = `Bonjour ${props.user.gender == 'MALE' ? 'M.' : 'Mme'} ${props.user.lastName.toUpperCase()}.\nVotre mot de passe FONDATION vient d'être mis à jour:\n\n        ${password}\n\nMerci de le conserver dans votre coffre Vaultwarden, et de supprimer ce mail.\n\nCordialement,\nl'équipe d'administration FONDATION.`;
              const link = `mailto:${props.user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;

              const $a = document.createElement('a');
              $a.href = link;
              document.body.appendChild($a);
              $a.click();
              $a.remove();
            }

            reset();
          }
        }
      );
    },
    [password, confirmation, props, changeEdition, updatePassword, reset]
  );

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Mot de passe</dt>
        {isEditing ? (
          <div className="flex gap-1">
            <Button
              size="small"
              disabled={isPending}
              onClick={() => changeEdition(false)}
              type="button"
              priority="tertiary no outline"
              iconId="fr-icon-close-line"
            >
              Fermer
            </Button>
            <Button
              size="small"
              disabled={isPending}
              onClick={handleSave}
              type="button"
              priority="primary"
              iconId="ri-check-line"
            >
              Ok
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => changeEdition(true)}
            disabled={isPending}
            title="Modifier le mot de passe"
            priority="tertiary no outline"
            size="small"
            className="rounded-full"
            iconId="fr-icon-edit-fill"
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <Input
            label="Mot de passe"
            hideLabel
            state={formError || error ? 'error' : undefined}
            stateRelatedMessage={formError ?? (error ? 'Erreur à la mise à jour du mot de passe' : undefined)}
            nativeInputProps={{
              type: 'password',
              autoFocus: true,
              autoComplete: 'off',
              required: true,
              value: password,
              onChange: onChange,
              placeholder: 'Nouveau mot de passe...'
            }}
          />
        </form>
      ) : (
        <dd className="mt-2 rounded border border-gray-300 bg-gray-50 p-4 text-gray-400">••••••••</dd>
      )}
    </div>
  );
}

function RoleField(props: { user: DetailedAdminUserDto }) {
  const confirmation = useConfirmation();
  const navigate = useNavigate();
  const [isEditing, setEditing] = React.useState(false);

  const { user: currentUser } = useUser();
  const { mutate: logout } = useLogout();
  const { mutate: updateRole, isPending, error } = useUpdateUserRoleMutation(props.user.id);

  const handleChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.preventDefault();
      const newRole = e.target.value as unknown as RoleEnum;

      if (newRole === props.user.role) return;

      const isSelfDemotion = currentUser?.id === props.user.id && newRole !== 'ADMIN';
      if (isSelfDemotion) {
        const { isConfirmed } = await confirmation.waitForConfirmation({
          title: 'Vous allez perdre vos droits administrateur',
          content: 'Cette action modifie votre rôle. Vous serez déconnecté immédiatement.'
        });

        if (!isConfirmed) {
          setEditing(false);
          return;
        }
      }

      updateRole(
        { role: newRole },
        {
          onSuccess: () => {
            setEditing(false);

            if (isSelfDemotion) {
              logout(undefined, { onSuccess: () => navigate(ROUTE_PATHS.LOGIN) });
            }
          }
        }
      );
    },
    [props, confirmation, currentUser, setEditing, logout, navigate, updateRole]
  );

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Rôle</dt>
        {isEditing ? (
          <Button
            size="small"
            disabled={isPending}
            onClick={() => setEditing(false)}
            type="button"
            priority="primary"
            iconId="ri-check-line"
          >
            Ok
          </Button>
        ) : (
          <Button
            onClick={() => setEditing(true)}
            disabled={isPending}
            title="Modifier le rôle"
            priority="tertiary no outline"
            size="small"
            className="rounded-full"
            iconId="fr-icon-edit-fill"
          />
        )}
      </div>
      {isEditing ? (
        <Select
          label=""
          state={error ? 'error' : undefined}
          stateRelatedMessage={error ? 'Erreur à la mise à jour du rôle' : undefined}
          nativeSelectProps={{ autoFocus: true, onChange: handleChange, defaultValue: props.user.role }}
        >
          {ROLE_OPTIONS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
      ) : (
        <dd className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">
          {RoleEnumLabels[props.user.role]}
        </dd>
      )}
    </div>
  );
}

function TitleField(props: { user: DetailedAdminUserDto }) {
  const confirmation = useConfirmation();
  const [isEditing, setEditing] = React.useState(false);
  const { mutate, isPending, error } = useUpdateUserTitleMutation(props.user.id);

  const handleChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTitle = (e.target.value || null) as unknown as UserTitleEnum | null;

      if (newTitle === props.user.title) {
        setEditing(false);
        return;
      }

      if (newTitle) {
        const fullName = toFullName(props.user);
        const { isConfirmed } = await confirmation.waitForConfirmation({
          title: `Remplacement du ${UserTitleEnumLabels[newTitle]}`,
          content: `${fullName} remplacera le ${UserTitleEnumLabels[newTitle]} actuel`
        });

        if (!isConfirmed) {
          setEditing(false);
          return;
        }
      }

      mutate({ title: newTitle }, { onSuccess: () => setEditing(false) });
    },
    [confirmation, props, mutate]
  );

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Distinction</dt>
        {isEditing ? (
          <Button
            size="small"
            disabled={isPending}
            onClick={() => setEditing(false)}
            type="button"
            priority="primary"
            iconId="ri-check-line"
          >
            Ok
          </Button>
        ) : (
          <Button
            onClick={() => setEditing(true)}
            disabled={isPending}
            title="Modifier la distinction"
            priority="tertiary no outline"
            size="small"
            className="rounded-full"
            iconId="fr-icon-edit-fill"
          />
        )}
      </div>
      {isEditing ? (
        <Select
          label=""
          state={error ? 'error' : undefined}
          stateRelatedMessage={error ? 'Erreur à la mise à jour de la distinction' : undefined}
          nativeSelectProps={{
            defaultValue: props.user.title,
            autoFocus: true,
            onChange: handleChange
          }}
        >
          <option value="">Aucune</option>
          {USER_TITLE_ENUM_OPTIONS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
      ) : (
        <dd className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">
          {props.user.title ? (
            UserTitleEnumLabels[props.user.title]
          ) : (
            <span className="text-gray-400">Aucun</span>
          )}
        </dd>
      )}
    </div>
  );
}

function DisplayTitleField(props: { user: DetailedAdminUserDto }) {
  const [isEditing, setEditing] = React.useState(false);
  const [displayTitle, setDisplayTitle] = React.useState(props.user.displayTitle ?? '');
  const { mutate, isPending, error } = useUpdateUserDisplayTitleMutation(props.user.id);

  const handleEdit = () => {
    setDisplayTitle(props.user.displayTitle ?? '');
    setEditing(true);
  };

  const handleSave = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();

      const newTitle = displayTitle.trim() || null;
      if (newTitle === props.user.displayTitle) {
        setEditing(false);
        return;
      }

      mutate({ displayTitle: newTitle }, { onSuccess: () => setEditing(false) });
    },
    [mutate, displayTitle, setEditing, props]
  );

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Titre</dt>
        {isEditing ? (
          <Button
            size="small"
            disabled={isPending}
            onClick={handleSave}
            priority="primary"
            iconId="ri-check-line"
          >
            Ok
          </Button>
        ) : (
          <Button
            onClick={handleEdit}
            disabled={isPending}
            title="Éditer le titre affiché"
            priority="tertiary no outline"
            size="small"
            className="rounded-full"
            iconId="fr-icon-edit-fill"
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <Input
            label="Titre affiché"
            hideLabel
            hintText="ex: M. le Président, Mme la ministre"
            state={error ? 'error' : undefined}
            stateRelatedMessage={error ? 'Erreur à la mise à jour du titre affiché' : undefined}
            nativeInputProps={{
              autoFocus: true,
              autoComplete: 'off',
              value: displayTitle,
              onChange: (e) => setDisplayTitle(e.target.value),
              placeholder: 'Saisissez un titre...'
            }}
          />
        </form>
      ) : (
        <div className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">
          {props.user.displayTitle || <span className="text-gray-400">Aucun titre</span>}
        </div>
      )}
    </div>
  );
}

function DutyField(props: { user: DetailedAdminUserDto }) {
  const [isEditing, setEditing] = React.useState(false);
  const { mutate, isPending, error } = useUpdateUserDutyMutation(props.user.id);

  const handleChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.preventDefault();

      const newDuty = (e.target.value || null) as unknown as UserDutyEnum | null;
      if (newDuty === props.user.duty) {
        setEditing(false);
        return;
      }

      mutate({ duty: newDuty }, { onSuccess: () => setEditing(false) });
    },
    [props, setEditing, mutate]
  );

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Fonction</dt>
        {isEditing ? (
          <Button
            size="small"
            disabled={isPending}
            onClick={() => setEditing(false)}
            type="button"
            priority="primary"
            iconId="ri-check-line"
          >
            Ok
          </Button>
        ) : (
          <Button
            onClick={() => setEditing(true)}
            disabled={isPending}
            title="Modifier la fonction"
            priority="tertiary no outline"
            size="small"
            className="rounded-full"
            iconId="fr-icon-edit-fill"
          />
        )}
      </div>
      {isEditing ? (
        <Select
          label=""
          state={error ? 'error' : undefined}
          stateRelatedMessage={error ? 'Erreur à la mise à jour de la fonction' : undefined}
          nativeSelectProps={{
            defaultValue: props.user.duty,
            autoFocus: true,
            onChange: handleChange
          }}
        >
          <option value="">Aucune</option>
          {USER_DUTY_ENUM_OPTIONS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
      ) : (
        <dd className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">
          {props.user.duty ? (
            UserDutyEnumLabels[props.user.duty]
          ) : (
            <span className="text-gray-400">Aucune</span>
          )}
        </dd>
      )}
    </div>
  );
}

function AdminLoadedUserDetail(props: { user: DetailedAdminUserDto }) {
  const { user } = props;
  const fullName = toFullName(user);

  return (
    <div className="fr-container max-w-2xl pb-12">
      <h1 className="fr-display-xl text-center">{fullName}</h1>

      <article className="mt-16 flex flex-col gap-y-8">
        <section>
          <h2 className="fr-display-xs">Compte</h2>
          <dl className="flex flex-col gap-y-4">
            <EmailField user={user} />
            <PasswordField user={user} />
          </dl>
        </section>

        <section>
          <h2 className="fr-display-xs">Rôle</h2>
          <dl className="flex flex-col gap-y-4">
            <RoleField user={user} />
          </dl>
        </section>

        <section>
          <h2 className="fr-display-xs">Titre</h2>
          <dl className="flex flex-col gap-y-4">
            <TitleField user={user} />
            <DutyField user={user} />
            <DisplayTitleField user={user} />
          </dl>
        </section>
      </article>
    </div>
  );
}

export function AdminUserDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const userId = params.userId;
  const { data: user, isLoading, isError } = useAdminUserDetailQuery(userId);

  const hasHistory = window.history.length > 0;
  const goBack = React.useCallback(() => {
    if (hasHistory) {
      navigate(-1);
    }
  }, [hasHistory, navigate]);

  if (isLoading) return;
  if (isError || !user || !userId) return <div className="fr-container py-8">Utilisateur introuvable.</div>;

  const fullName = user ? toFullName(user) : undefined;

  return (
    <div className="fr-container pt-10">
      <div className="flex items-start justify-between">
        <Breadcrumb
          id="administration-breadcrumb"
          ariaLabel="Fil d'Ariane pour l'Administration"
          breadcrumb={{
            currentPageLabel: isLoading ? '...' : fullName!,
            segments: [
              { label: 'Administration', to: {} },
              { label: 'Utilisateurs', to: ROUTE_PATHS.ADMIN.USERS }
            ]
          }}
        />
        {hasHistory && (
          <Button size="small" iconId="fr-icon-close-line" priority="tertiary no outline" onClick={goBack}>
            FERMER
          </Button>
        )}
      </div>

      {isLoading && <div className="py-8">Chargement...</div>}
      {(isError || !user || !userId) && <div className="py-8">Utilisateur introuvable</div>}
      {user && <AdminLoadedUserDetail user={user} />}
    </div>
  );
}
