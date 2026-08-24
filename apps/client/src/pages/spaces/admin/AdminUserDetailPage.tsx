import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, type ChangeEvent, type SyntheticEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { AdminUserRole } from '@/features/administration/components/AdminUserRole';
import {
  PROMOTABLE_ROLES,
  ROLE_OPTIONS,
  type AdminUserRoleEnum,
} from '@/features/administration/labels/admin-user-enum';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useTab } from '@/shared/hooks/useTab';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { memberFullName } from '@/utils/user.utils';
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
  const { formatMessage } = useIntl();
  const [isEditing, setEditing] = useState(false);
  const [email, setEmail] = useState(props.user.email);
  const { mutate, isPending, error } = useUpdateUserEmailMutation(props.user.id);

  const formError = useMemo(() => (email.trim().length === 0 ? `Champ obligatoire` : undefined), [email]);

  const handleEdit = useCallback(() => {
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
        <dt className="font-bold">
          <FormattedMessage defaultMessage="Email" />
        </dt>
        {isEditing ? (
          <div className="flex gap-1">
            <Button
              disabled={isPending}
              iconId="fr-icon-close-line"
              onClick={() => setEditing(false)}
              priority="tertiary no outline"
              size="small"
              type="button"
            >
              Fermer
            </Button>
            <Button
              disabled={isPending}
              iconId="ri-check-line"
              onClick={handleSave}
              priority="primary"
              size="small"
              type="button"
            >
              Ok
            </Button>
          </div>
        ) : (
          <Button
            className="rounded-full"
            disabled={isPending}
            iconId="fr-icon-edit-fill"
            onClick={handleEdit}
            priority="tertiary no outline"
            size="small"
            title={formatMessage({ defaultMessage: "Éditer l'email" })}
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <Input
            hideLabel
            label={formatMessage({ defaultMessage: 'Email' })}
            nativeInputProps={{
              type: 'email',
              autoFocus: true,
              autoComplete: 'off',
              value: email,
              onChange: (e) => setEmail(e.target.value),
            }}
            state={formError || error ? 'error' : undefined}
            stateRelatedMessage={
              formError ??
              (error ? formatMessage({ defaultMessage: "Erreur à la mise à jour de l'email" }) : undefined)
            }
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
  const confirmation = useConfirmModal();
  const [isEditing, setEditing] = useState(false);
  const [password, setPassword] = useState('');
  const { mutate: updatePassword, isPending, error, reset } = useUpdateUserPasswordMutation(props.user.id);

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const formError = useMemo(
    () => (isDirty && password.trim().length === 0 ? `Champ obligatoire` : undefined),
    [isDirty, password],
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!isDirty) setIsDirty(true);
      const value = e.target.value;
      setPassword(value);
    },
    [isDirty, setIsDirty, setPassword],
  );

  const changeEdition = useCallback(
    (edition: boolean) => {
      setPassword('');
      setIsDirty(false);
      setEditing(edition);
    },
    [setIsDirty, setEditing],
  );

  const handleSave = useCallback(
    (e?: SyntheticEvent) => {
      e?.preventDefault();

      const trimmed = password.trim();
      if (!trimmed) return;
      updatePassword(
        { password: trimmed },
        {
          onSuccess: async () => {
            changeEdition(false);

            const fullName = memberFullName(props.user);
            const { isConfirmed } = await confirmation.waitForConfirmation({
              title: $t({
                defaultMessage: `Notifier l'utilisateur de son nouveau mot de passe\u00A0?`,
              }),
              i18n: { confirm: $t({ defaultMessage: `Notifier {fullName}` }, { fullName }) },
              content: (
                <p>
                  <FormattedMessage
                    defaultMessage={`Le mot de passe de <italic>{fullName}</italic> a été mis à jour. Voulez-vous {gender, select, MALE {le} other {la}} notifier par mail\u00A0?`}
                    values={{
                      fullName,
                      gender: props.user.gender,
                      italic: (chunk) => <em>{chunk}</em>,
                    }}
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
        <dt className="font-bold">
          <FormattedMessage defaultMessage="Mot de passe" />
        </dt>
        {isEditing ? (
          <div className="flex gap-1">
            <Button
              disabled={isPending}
              iconId="fr-icon-close-line"
              onClick={() => changeEdition(false)}
              priority="tertiary no outline"
              size="small"
              type="button"
            >
              Fermer
            </Button>
            <Button
              disabled={isPending}
              iconId="ri-check-line"
              onClick={handleSave}
              priority="primary"
              size="small"
              type="button"
            >
              Ok
            </Button>
          </div>
        ) : (
          <Button
            className="rounded-full"
            disabled={isPending}
            iconId="fr-icon-edit-fill"
            onClick={() => changeEdition(true)}
            priority="tertiary no outline"
            size="small"
            title={$t({ defaultMessage: 'Modifier le mot de passe' })}
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <Input
            hideLabel
            label={$t({ defaultMessage: 'Mot de passe' })}
            nativeInputProps={{
              type: 'password',
              autoFocus: true,
              autoComplete: 'off',
              required: true,
              value: password,
              onChange: onChange,
              placeholder: $t({ defaultMessage: 'Nouveau mot de passe...' }),
            }}
            state={formError || error ? 'error' : undefined}
            stateRelatedMessage={
              formError ??
              (error ? $t({ defaultMessage: 'Erreur à la mise à jour du mot de passe' }) : undefined)
            }
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
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmation = useConfirmModal();
  const { user: currentUser } = useUser();
  const promote = usePromoteUserToAdmin(props.user.id);
  const demote = useDemoteUserFromAdmin(props.user.id);

  const onChange = useCallback(
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
                <p className="font-bold">
                  <FormattedMessage defaultMessage="Êtes-vous sûr de vouloir continuer ?" />
                </p>
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
      checked={props.user.isAdmin}
      classes={{ label: 'before:mr-1!' }}
      className={props.className}
      disabled={promote.isPending || demote.isPending}
      label={formatMessage({ defaultMessage: 'Administrateur' })}
      onChange={onChange}
      showCheckedHint={false}
    />
  );
}

function RoleField(props: { user: DetailedAdminUserDto }) {
  const intl = useIntl();
  const [isEditing, setEditing] = useState(false);

  const { mutate: updateRole, isPending, error } = useUpdateUserRoleMutation(props.user.id);

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLSelectElement>) => {
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
            disabled={isPending}
            iconId="ri-check-line"
            onClick={() => setEditing(false)}
            priority="primary"
            size="small"
            type="button"
          >
            Ok
          </Button>
        ) : (
          <Button
            className="rounded-full"
            disabled={isPending}
            iconId="fr-icon-edit-fill"
            onClick={() => setEditing(true)}
            priority="tertiary no outline"
            size="small"
            title={intl.formatMessage({ defaultMessage: 'Modifier le rôle' })}
          />
        )}
      </div>
      {isEditing ? (
        <Select
          label=""
          nativeSelectProps={{
            autoFocus: true,
            onChange: handleChange,
            defaultValue: props.user.role,
          }}
          state={error ? 'error' : undefined}
          stateRelatedMessage={
            error ? intl.formatMessage({ defaultMessage: 'Erreur à la mise à jour du rôle' }) : undefined
          }
        >
          {ROLE_OPTIONS.map(({ name, options }) => (
            <optgroup key={name} label={name}>
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
          <AdminUserRole gender={props.user.gender} value={props.user.role} />
        </dd>
      )}
      <AdminUserPromotionToggle className="fr-mt-2v fr-ml-4v" user={props.user} />
    </div>
  );
}

function DisplayTitleField(props: { user: DetailedAdminUserDto }) {
  const { formatMessage } = useIntl();
  const [isEditing, setEditing] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(props.user.displayTitle ?? '');
  const { mutate, isPending, error } = useUpdateUserDisplayTitleMutation(props.user.id);

  const handleEdit = () => {
    setDisplayTitle(props.user.displayTitle ?? '');
    setEditing(true);
  };

  const handleSave = useCallback(
    (e: SyntheticEvent) => {
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
        <dt className="font-bold">
          <FormattedMessage defaultMessage="Titre" />
        </dt>
        {isEditing ? (
          <Button
            disabled={isPending}
            iconId="ri-check-line"
            onClick={handleSave}
            priority="primary"
            size="small"
          >
            Ok
          </Button>
        ) : (
          <Button
            className="rounded-full"
            disabled={isPending}
            iconId="fr-icon-edit-fill"
            onClick={handleEdit}
            priority="tertiary no outline"
            size="small"
            title={formatMessage({ defaultMessage: 'Éditer le titre affiché' })}
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <Input
            hideLabel
            hintText="ex: M. le Président, Mme la ministre"
            label={formatMessage({ defaultMessage: 'Titre affiché' })}
            nativeInputProps={{
              autoFocus: true,
              autoComplete: 'off',
              value: displayTitle,
              onChange: (e) => setDisplayTitle(e.target.value),
              placeholder: formatMessage({ defaultMessage: 'Saisissez un titre...' }),
            }}
            state={error ? 'error' : undefined}
            stateRelatedMessage={
              error
                ? formatMessage({ defaultMessage: 'Erreur à la mise à jour du titre affiché' })
                : undefined
            }
          />
        </form>
      ) : (
        <div className="fr-mt-2v fr-p-4v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
          {props.user.displayTitle || (
            <span className="text-(--text-disabled-grey)">
              <FormattedMessage defaultMessage="Aucun titre" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function AdminLoadedUserDetail(props: { user: DetailedAdminUserDto }) {
  const { user } = props;
  const fullName = memberFullName(user);
  const isUserImpersonable = !(
    ['FIRST_SECRETARY', 'OFFICER', 'SECRETARY'] satisfies DetailedAdminUserDto['role'][]
  ).includes(user.role as any); // oxlint-disable-line @typescript-eslint/no-explicit-any

  const tab = useTab();
  const { mutate: impersonate, isPending } = useImpersonateMutation({ userId: props.user.id });
  const onClick = useCallback(() => {
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
            className="rounded-full"
            disabled={isPending}
            iconId="ri-user-shared-fill"
            onClick={onClick}
            priority="secondary"
            size="small"
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
  const { formatMessage } = useIntl();
  const params = useParams();
  const navigate = useNavigate();
  const userId = params.userId;
  const { data: user, isLoading, isError } = useAdminUserDetailQuery(userId);

  const hasHistory = window.history.length > 0;
  const goBack = useCallback(() => {
    if (hasHistory) {
      navigate(-1);
    }
  }, [hasHistory, navigate]);

  if (isLoading) return;
  if (isError || !user || !userId)
    return (
      <div className="fr-container fr-py-8v">
        <FormattedMessage defaultMessage="Utilisateur introuvable" />
      </div>
    );

  const fullName = user ? memberFullName(user) : undefined;

  return (
    <div className="fr-container fr-pt-10v">
      <div className="flex items-start justify-between">
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
          breadcrumb={{
            currentPageLabel: isLoading ? '...' : fullName!,
            segments: [
              { label: formatMessage({ defaultMessage: 'Administration' }), to: {} },
              { label: formatMessage({ defaultMessage: 'Utilisateurs' }), to: ROUTE_PATHS.ADMIN.USERS },
            ],
          }}
          id="administration-breadcrumb"
        />
        {hasHistory && (
          <Button iconId="fr-icon-close-line" onClick={goBack} priority="tertiary no outline" size="small">
            FERMER
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="fr-py-8v">
          <FormattedMessage defaultMessage="Chargement..." />
        </div>
      )}
      {(isError || !user || !userId) && (
        <div className="fr-py-8v">
          <FormattedMessage defaultMessage="Utilisateur introuvable" />
        </div>
      )}
      {user && <AdminLoadedUserDetail user={user} />}
    </div>
  );
}
