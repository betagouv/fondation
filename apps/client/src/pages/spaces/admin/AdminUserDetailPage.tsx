import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { AdminUserRole } from '@/features/administration/components/AdminUserRole';
import {
  PROMOTABLE_ROLES,
  ROLE_OPTIONS,
  type AdminUserRoleEnum,
} from '@/features/administration/labels/admin-user-enum';
import { useConfirmation } from '@/shared/context/confirmation/useConfirmation.hook';
import { useTab } from '@/shared/hooks/useTab';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { toFullName } from '@/utils/user.utils';
import type { DetailedAdminUserDto } from '@api/types';
import {
  useAdminUserDetailQuery,
  useDemoteUserFromAdmin,
  usePromoteUserToAdmin,
  useUpdateUserDisplayTitleMutation,
  useUpdateUserEmailMutation,
  useUpdateUserPasswordMutation,
  useUpdateUserRoleMutation,
} from '@queries/administration.queries';
import { authKeys, useImpersonateMutation, useUser } from '@queries/auth.queries';

function EmailField(props: { user: DetailedAdminUserDto }) {
  const [isEditing, setEditing] = React.useState(false);
  const [email, setEmail] = React.useState(props.user.email);
  const { mutate, isPending, error } = useUpdateUserEmailMutation(props.user.id);

  const formError = React.useMemo(
    () => (email.trim().length === 0 ? `Champ obligatoire` : undefined),
    [email],
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
      <div className="fr-mb-2v flex justify-between">
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
              onChange: (e) => setEmail(e.target.value),
            }}
          />
        </form>
      ) : (
        <dd className="fr-px-4v fr-py-2v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
          {props.user.email}
        </dd>
      )}
    </div>
  );
}

function PasswordField(props: { user: DetailedAdminUserDto }) {
  const { $t } = useIntl();
  const confirmation = useConfirmation();
  const [isEditing, setEditing] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const { mutate: updatePassword, isPending, error, reset } = useUpdateUserPasswordMutation(props.user.id);

  const [isDirty, setIsDirty] = React.useState<boolean>(false);
  const formError = React.useMemo(
    () => (isDirty && password.trim().length === 0 ? `Champ obligatoire` : undefined),
    [isDirty, password],
  );

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isDirty) setIsDirty(true);
      const value = e.target.value;
      setPassword(value);
    },
    [isDirty, setIsDirty, setPassword],
  );

  const changeEdition = React.useCallback(
    (edition: boolean) => {
      setPassword('');
      setIsDirty(false);
      setEditing(edition);
    },
    [setIsDirty, setEditing],
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
              title: $t({
                defaultMessage: `Notifier l'utilisateur de son nouveau mot de passe\u00A0?`,
              }),
              i18n: { confirm: $t({ defaultMessage: `Notifier {fullName}` }, { fullName }) },
              content: (
                <p>
                  <FormattedMessage
                    values={{
                      fullName,
                      gender: props.user.gender,
                      italic: (chunk) => <em>{chunk}</em>,
                    }}
                    defaultMessage={`Le mot de passe de <italic>{fullName}</italic> a été mis à jour. Voulez-vous {gender, select, MALE {le} other {la}} notifier par mail\u00A0?`}
                  />
                </p>
              ),
            });

            if (isConfirmed) {
              const subject = `Mot de passe FONDATION mis à jour`;
              const intro = $t(
                {
                  defaultMessage: `Bonjour {gender, select, MALE {M.} other {Mme}}\u00A0{lastName},`,
                },
                { gender: props.user.gender, lastName: props.user.lastName.toUpperCase() },
              );

              /** @warning formatjs discards line breaks */
              const nonDynamicContent =
                `votre mot de passe FONDATION vient d'être mis à jour:\n\n        ${password}\n\n` +
                `Merci de le conserver dans votre coffre Vaultwarden, et de supprimer ce mail.\n\n` +
                `Cordialement,\nl'équipe d'administration FONDATION.`;

              const content = intro + `\n${nonDynamicContent}`;
              const link = `mailto:${props.user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;

              const $a = document.createElement('a');
              $a.href = link;
              document.body.appendChild($a);
              $a.click();
              $a.remove();
            }

            reset();
          },
        },
      );
    },
    [password, confirmation, props, changeEdition, updatePassword, reset, $t],
  );

  return (
    <div>
      <div className="fr-mb-2v flex justify-between">
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
              placeholder: 'Nouveau mot de passe...',
            }}
          />
        </form>
      ) : (
        <dd className="fr-mt-2v fr-px-4v fr-py-2v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey) text-(--text-disabled-grey)">
          ••••••••
        </dd>
      )}
    </div>
  );
}

function AdminUserPromotionToggle(props: { user: DetailedAdminUserDto; className?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmation = useConfirmation();
  const { user: currentUser } = useUser();
  const promote = usePromoteUserToAdmin(props.user.id);
  const demote = useDemoteUserFromAdmin(props.user.id);

  const onChange = React.useCallback(
    async (checked: boolean) => {
      if (checked) {
        promote.mutate();
      } else {
        if (props.user.id === currentUser?.id) {
          const { isConfirmed } = await confirmation.waitForConfirmation({
            title: `Vous allez changer vos droits`,
            content: (
              <>
                <p>
                  En confirmant, vous allez vous retirer les droits d'administration. Vous ne pourrez plus
                  accéder à cette page ensuite.
                </p>
                <p className="font-bold">Êtes-vous sûr de vouloir continuer ?</p>
              </>
            ),
          });

          if (!isConfirmed) return;
        }

        demote.mutate(undefined, {
          onSuccess() {
            if (props.user.id === currentUser?.id) {
              queryClient.invalidateQueries({ queryKey: authKeys.introspectSession() });
              return navigate(generatePath(ROUTE_PATHS.SG.DASHBOARD));
            }
          },
        });
      }
    },
    [promote, demote, currentUser, props.user, confirmation, queryClient, navigate],
  );

  if (!PROMOTABLE_ROLES.includes(props.user.role)) return null;

  return (
    <ToggleSwitch
      classes={{ label: 'before:mr-1!' }}
      className={props.className}
      checked={props.user.isAdmin}
      disabled={promote.isPending || demote.isPending}
      onChange={onChange}
      label="Administrateur"
      showCheckedHint={false}
    />
  );
}

function RoleField(props: { user: DetailedAdminUserDto }) {
  const intl = useIntl();
  const [isEditing, setEditing] = React.useState(false);

  const { mutate: updateRole, isPending, error } = useUpdateUserRoleMutation(props.user.id);

  const handleChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.preventDefault();
      const newRole = e.target.value as unknown as AdminUserRoleEnum;
      if (newRole === props.user.role) return;

      updateRole(
        { role: newRole },
        {
          onSuccess: () => {
            setEditing(false);
          },
        },
      );
    },
    [props, setEditing, updateRole],
  );

  return (
    <div>
      <div className="fr-mb-2v flex justify-between">
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
          nativeSelectProps={{
            autoFocus: true,
            onChange: handleChange,
            defaultValue: props.user.role,
          }}
        >
          {ROLE_OPTIONS.map(({ name, options }) => (
            <optgroup label={name} key={name}>
              {options.map(({ id, label }) => (
                <option key={id} value={id}>
                  {intl.formatMessage(label, { gender: props.user.gender })}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      ) : (
        <dd className="fr-mt-2v fr-px-4v fr-py-2v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
          <AdminUserRole value={props.user.role} gender={props.user.gender} />
        </dd>
      )}
      <AdminUserPromotionToggle className="fr-mt-2v fr-ml-4v" user={props.user} />
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
    [mutate, displayTitle, setEditing, props],
  );

  return (
    <div>
      <div className="fr-mb-2v flex justify-between">
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
              placeholder: 'Saisissez un titre...',
            }}
          />
        </form>
      ) : (
        <div className="fr-mt-2v fr-p-4v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
          {props.user.displayTitle || <span className="text-(--text-disabled-grey)">Aucun titre</span>}
        </div>
      )}
    </div>
  );
}

function AdminLoadedUserDetail(props: { user: DetailedAdminUserDto }) {
  const { user } = props;
  const fullName = toFullName(user);
  const isUserImpersonable = !(
    ['FIRST_SECRETARY', 'OFFICER', 'SECRETARY'] satisfies DetailedAdminUserDto['role'][]
  ).includes(user.role as any); // oxlint-disable-line @typescript-eslint/no-explicit-any

  const tab = useTab();
  const { mutate: impersonate, isPending } = useImpersonateMutation({ userId: props.user.id });
  const onClick = React.useCallback(() => {
    impersonate(undefined, {
      onSuccess() {
        const url = new URL(generatePath(ROUTE_PATHS.TRANSPARENCES.DASHBOARD), window.location.href);
        tab.open(url);
      },
    });
  }, [tab, impersonate]);

  return (
    <div className="admin-user-detail-page fr-pb-12v mx-auto max-w-2xl">
      <h1 className="fr-display-xl text-center">{fullName}</h1>
      {isUserImpersonable && (
        <p className="text-center">
          <Button
            size="small"
            onClick={onClick}
            className="rounded-full"
            disabled={isPending}
            priority="secondary"
            iconId="ri-user-shared-fill"
          >
            Se connecter
          </Button>
        </p>
      )}

      <section className="fr-mt-16v flex flex-col gap-y-8">
        <dl className="flex flex-col gap-y-4">
          <EmailField user={user} />
          <PasswordField user={user} />
          <RoleField user={user} />
          <DisplayTitleField user={user} />
        </dl>
      </section>
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
  if (isError || !user || !userId)
    return <div className="fr-container fr-py-8v">Utilisateur introuvable.</div>;

  const fullName = user ? toFullName(user) : undefined;

  return (
    <div className="fr-container fr-pt-10v">
      <div className="flex items-start justify-between">
        <Breadcrumb
          id="administration-breadcrumb"
          ariaLabel="Fil d'Ariane pour l'Administration"
          breadcrumb={{
            currentPageLabel: isLoading ? '...' : fullName!,
            segments: [
              { label: 'Administration', to: {} },
              { label: 'Utilisateurs', to: ROUTE_PATHS.ADMIN.USERS },
            ],
          }}
        />
        {hasHistory && (
          <Button size="small" iconId="fr-icon-close-line" priority="tertiary no outline" onClick={goBack}>
            FERMER
          </Button>
        )}
      </div>

      {isLoading && <div className="fr-py-8v">Chargement...</div>}
      {(isError || !user || !userId) && <div className="fr-py-8v">Utilisateur introuvable</div>}
      {user && <AdminLoadedUserDetail user={user} />}
    </div>
  );
}
