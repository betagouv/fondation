import PasswordInput from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useTitleTakenBackWarning } from '@/features/administration/hooks/useTitleTakenBackWarning';
import { UserStatusBadge } from '@/shared/components/user-status-badge';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useTab } from '@/shared/hooks/useTab';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsCard, DetailsHeader, DetailsPageLayout } from '@/shared/ui/details';
import { IconButton, iconButtonClassName } from '@/shared/ui/icon-button';
import { Tooltip } from '@/shared/ui/tooltip';
import { isStrongPassword, passwordRuleStates } from '@/utils/password.utils';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { memberFullName } from '@/utils/user.utils';
import type { DetailedAdminUserDto } from '@api/types';
import {
  type AdminUserRoleEnum,
  useAdminUserDetailQuery,
  useAdminUserRolesQuery,
  useDeactivateUserMutation,
  useDemoteUserFromAdmin,
  usePromoteUserToAdmin,
  useReactivateUserMutation,
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
  const { error, isPending, mutate } = useUpdateUserEmailMutation(props.user.id);

  const formError = useMemo(
    () => (email.trim().length === 0 ? formatMessage({ defaultMessage: 'Champ obligatoire' }) : undefined),
    [email, formatMessage],
  );

  const handleEdit = useCallback(() => {
    setEmail(props.user.email);
    setEditing(true);
  }, [props, setEditing, setEmail]);

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
              <FormattedMessage defaultMessage="Fermer" />
            </Button>
            <Button disabled={isPending} onClick={handleSave} priority="primary" size="small" type="button">
              <FormattedMessage defaultMessage="Ok" />
            </Button>
          </div>
        ) : (
          <IconButton
            disabled={isPending}
            iconId="fr-icon-edit-fill"
            label={formatMessage({ defaultMessage: "Éditer l'email" })}
            onClick={handleEdit}
            small
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <Input
            hideLabel
            label={formatMessage({ defaultMessage: 'Email' })}
            nativeInputProps={{
              autoComplete: 'off',
              autoFocus: true,
              onChange: (e) => setEmail(e.target.value),
              type: 'email',
              value: email,
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
  const { formatMessage } = useIntl();
  const confirmation = useConfirmModal();
  const [isEditing, setEditing] = useState(false);
  const [password, setPassword] = useState('');
  const { error, isPending, mutate: updatePassword, reset } = useUpdateUserPasswordMutation(props.user.id);

  const [isSubmitted, setSubmitted] = useState(false);

  const changeEdition = useCallback(
    (edition: boolean) => {
      setPassword('');
      setSubmitted(false);
      setEditing(edition);
    },
    [setEditing, setSubmitted],
  );

  const handleSave = useCallback(
    (e?: SyntheticEvent) => {
      e?.preventDefault();

      setSubmitted(true);
      const trimmed = password.trim();
      if (!isStrongPassword(trimmed)) return;
      updatePassword(
        { password: trimmed },
        {
          onSuccess: async () => {
            changeEdition(false);

            const fullName = memberFullName(props.user);
            const { isConfirmed } = await confirmation.waitForConfirmation({
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
              i18n: { confirm: formatMessage({ defaultMessage: `Notifier {fullName}` }, { fullName }) },
              title: formatMessage({
                defaultMessage: `Notifier l'utilisateur de son nouveau mot de passe\u00A0?`,
              }),
            });

            if (isConfirmed) {
              const subject = `Mot de passe FONDATION mis à jour`;
              const intro = formatMessage(
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
    [changeEdition, confirmation, formatMessage, password, props, reset, updatePassword],
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
              <FormattedMessage defaultMessage="Fermer" />
            </Button>
            <Button disabled={isPending} onClick={handleSave} priority="primary" size="small" type="button">
              <FormattedMessage defaultMessage="Ok" />
            </Button>
          </div>
        ) : (
          <IconButton
            disabled={isPending}
            iconId="fr-icon-edit-fill"
            label={formatMessage({ defaultMessage: 'Modifier le mot de passe' })}
            onClick={() => changeEdition(true)}
            small
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <PasswordInput
            hideLabel
            hintText={formatMessage({
              defaultMessage: `Ce mot de passe est provisoire : invitez l'utilisateur à le changer depuis "Mon compte".`,
            })}
            label={formatMessage({ defaultMessage: 'Mot de passe' })}
            messages={[
              ...passwordRuleStates(password, isSubmitted).map((rule) => ({
                ...rule,
                message: formatMessage(rule.message),
              })),
              ...(error
                ? [
                    {
                      message: formatMessage({ defaultMessage: 'Erreur à la mise à jour du mot de passe' }),
                      severity: 'error' as const,
                    },
                  ]
                : []),
            ]}
            messagesHint={formatMessage({ defaultMessage: 'Le mot de passe doit contenir :' })}
            nativeInputProps={{
              autoComplete: 'off',
              autoFocus: true,
              onChange: (event) => setPassword(event.target.value),
              placeholder: formatMessage({ defaultMessage: 'Nouveau mot de passe...' }),
              required: true,
              value: password,
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

function AdminUserPromotionToggle(props: { user: DetailedAdminUserDto }) {
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
            content: (
              <>
                <p>
                  <FormattedMessage defaultMessage="En confirmant, vous allez vous retirer les droits d'administration. Vous ne pourrez plus accéder à cette page ensuite." />
                </p>
                <p className="font-bold">
                  <FormattedMessage defaultMessage="Êtes-vous sûr de vouloir continuer ?" />
                </p>
              </>
            ),
            title: formatMessage({ defaultMessage: 'Vous allez changer vos droits' }),
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
    [confirmation, currentUser, demote, formatMessage, navigate, promote, props.user, queryClient],
  );

  if (!props.user.canHoldAdminRight) return null;

  return (
    <div className="fr-mt-6v">
      <p className="fr-mb-3v font-bold">
        <FormattedMessage defaultMessage="Administrateur" />
      </p>
      <ToggleSwitch
        checked={props.user.isAdmin}
        classes={{ label: 'fr-text--sm before:mr-1! text-(--text-default-grey)' }}
        disabled={promote.isPending || demote.isPending}
        label={formatMessage({ defaultMessage: "Peut accéder à l'onglet Administration" })}
        onChange={onChange}
        showCheckedHint={false}
      />
    </div>
  );
}

function RoleField(props: { user: DetailedAdminUserDto }) {
  const intl = useIntl();
  const [isEditing, setEditing] = useState(false);
  const [role, setRole] = useState<AdminUserRoleEnum>(props.user.role.id);
  const { data: roleGroups } = useAdminUserRolesQuery(props.user.gender, { enabled: isEditing });

  const { error, isPending, mutate: updateRole, reset } = useUpdateUserRoleMutation(props.user.id);
  const titleTakenBack = useTitleTakenBackWarning(role, { enabled: isEditing, userId: props.user.id });

  const handleEdit = useCallback(() => {
    setRole(props.user.role.id);
    reset();
    setEditing(true);
  }, [props.user.role.id, reset]);

  const handleSave = useCallback(() => {
    if (role === props.user.role.id) {
      setEditing(false);
      return;
    }

    updateRole({ role }, { onSuccess: () => setEditing(false) });
  }, [props.user.role.id, role, updateRole]);

  return (
    <div>
      <div className="fr-mb-2v flex justify-between">
        <dt className="font-bold">
          <FormattedMessage defaultMessage="Rôle" />
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
              <FormattedMessage defaultMessage="Fermer" />
            </Button>
            <Button disabled={isPending} onClick={handleSave} priority="primary" size="small" type="button">
              <FormattedMessage defaultMessage="Ok" />
            </Button>
          </div>
        ) : (
          <IconButton
            disabled={isPending}
            iconId="fr-icon-edit-fill"
            label={intl.formatMessage({ defaultMessage: 'Modifier le rôle' })}
            onClick={handleEdit}
            small
          />
        )}
      </div>
      {isEditing ? (
        <Select
          label=""
          nativeSelectProps={{
            'aria-label': intl.formatMessage({ defaultMessage: 'Rôle' }),
            autoFocus: true,
            onChange: (e) => setRole(e.target.value as AdminUserRoleEnum),
            value: role,
          }}
          hint={
            props.user.isAdmin
              ? intl.formatMessage({
                  defaultMessage: "Retirez d'abord les droits administrateur pour donner un rôle de membre",
                })
              : undefined
          }
          state={error ? 'error' : titleTakenBack ? 'info' : undefined}
          stateRelatedMessage={
            error ? intl.formatMessage({ defaultMessage: 'Erreur à la mise à jour du rôle' }) : titleTakenBack
          }
        >
          {roleGroups?.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {group.roles.map((option) => (
                <option
                  disabled={!props.user.assignableRoles.includes(option.id)}
                  key={option.id}
                  value={option.id}
                >
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      ) : (
        <dd className="fr-mt-2v fr-px-4v fr-py-2v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
          {props.user.role.label}
        </dd>
      )}
    </div>
  );
}

function DisplayTitleField(props: { user: DetailedAdminUserDto }) {
  const { formatMessage } = useIntl();
  const [isEditing, setEditing] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(props.user.displayTitle ?? '');
  const { error, isPending, mutate } = useUpdateUserDisplayTitleMutation(props.user.id);

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
    [displayTitle, mutate, props, setEditing],
  );

  return (
    <div>
      <div className="fr-mb-2v flex justify-between">
        <dt className="font-bold">
          <FormattedMessage defaultMessage="Titre" />
        </dt>
        {isEditing ? (
          <Button disabled={isPending} onClick={handleSave} priority="primary" size="small">
            <FormattedMessage defaultMessage="Ok" />
          </Button>
        ) : (
          <IconButton
            disabled={isPending}
            iconId="fr-icon-edit-fill"
            label={formatMessage({ defaultMessage: 'Éditer le titre affiché' })}
            onClick={handleEdit}
            small
          />
        )}
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <Input
            hideLabel
            hintText={formatMessage({ defaultMessage: 'ex: M. le Président, Mme la ministre' })}
            label={formatMessage({ defaultMessage: 'Titre affiché' })}
            nativeInputProps={{
              autoComplete: 'off',
              autoFocus: true,
              onChange: (e) => setDisplayTitle(e.target.value),
              placeholder: formatMessage({ defaultMessage: 'Saisissez un titre...' }),
              value: displayTitle,
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

function AccessCard(props: { user: DetailedAdminUserDto }) {
  const { formatDate, formatMessage, formatTime } = useIntl();
  const confirmation = useConfirmModal();
  const deactivate = useDeactivateUserMutation(props.user.id);
  const reactivate = useReactivateUserMutation(props.user.id);

  const onDeactivate = useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      content: (
        <p>
          <FormattedMessage
            defaultMessage="<bold>{fullName}</bold> ne pourra plus se connecter à Fondation et sa session en cours sera fermée. Son nom reste sur les dossiers, rapports et documents existants."
            values={{
              bold: (chunks) => <strong>{chunks}</strong>,
              fullName: memberFullName(props.user),
            }}
          />
        </p>
      ),
      i18n: { confirm: formatMessage({ defaultMessage: 'Désactiver le compte' }) },
      title: formatMessage({ defaultMessage: 'Désactiver le compte\u00A0?' }),
    });

    if (isConfirmed) deactivate.mutate();
  }, [confirmation, deactivate, formatMessage, props.user]);

  return (
    <DetailsCard className="grow">
      <div className="fr-mb-6v flex items-center justify-between gap-4">
        <h2 className="fr-h4 fr-mb-0">
          <FormattedMessage defaultMessage="Accès" />
        </h2>
        {props.user.canDeactivate && (
          <Button
            disabled={deactivate.isPending}
            iconId="fr-icon-lock-line"
            onClick={onDeactivate}
            priority="secondary"
            size="small"
            type="button"
          >
            <FormattedMessage defaultMessage="Désactiver le compte" />
          </Button>
        )}
        {props.user.canReactivate && (
          <Button
            disabled={reactivate.isPending}
            iconId="fr-icon-lock-unlock-line"
            onClick={() => reactivate.mutate()}
            priority="secondary"
            size="small"
            type="button"
          >
            <FormattedMessage defaultMessage="Réactiver le compte" />
          </Button>
        )}
      </div>
      <div>
        <p className="fr-mb-2v font-bold">
          <FormattedMessage defaultMessage="Compte" />
        </p>
        <div className="flex items-center gap-3">
          <UserStatusBadge status={props.user.status} />
          {props.user.deactivatedAt && (
            <span className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
              <FormattedMessage
                defaultMessage="depuis le {date} à {time}"
                values={{
                  date: formatDate(props.user.deactivatedAt, { format: 'zonedDateShort' }),
                  time: formatTime(props.user.deactivatedAt, { format: 'zonedTimeShort' }),
                }}
              />
            </span>
          )}
          <AccountStatusHistory statusChanges={props.user.statusChanges} />
        </div>
      </div>
      <AdminUserPromotionToggle user={props.user} />
    </DetailsCard>
  );
}

function AccountStatusHistory(props: { statusChanges: DetailedAdminUserDto['statusChanges'] }) {
  const { formatDate, formatMessage, formatTime } = useIntl();
  if (props.statusChanges.length === 0) return null;

  return (
    <Tooltip
      className="-ml-2"
      label={
        <ul className="fr-m-0 fr-p-0 flex list-none flex-col gap-1.5">
          {props.statusChanges.map(({ changedAt, status }, index) => {
            const values = {
              date: formatDate(changedAt, { format: 'zonedDateShort' }),
              time: formatTime(changedAt, { format: 'zonedTimeShort' }),
            };
            // the oldest change, last of the list, is the creation of the account
            const isCreation = index === props.statusChanges.length - 1;
            return (
              <li className="fr-p-0 flex items-center gap-2" key={changedAt}>
                {isCreation ? (
                  <FormattedMessage defaultMessage="Créé le {date} à {time}" values={values} />
                ) : (
                  <>
                    <UserStatusBadge status={status} />
                    <FormattedMessage defaultMessage="le {date} à {time}" values={values} />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      }
    >
      <button
        aria-label={formatMessage({ defaultMessage: 'Historique du compte' })}
        className={iconButtonClassName({ iconId: 'fr-icon-information-line', small: true })}
        type="button"
      />
    </Tooltip>
  );
}

function AdminUserDetailHeader(props: { action?: ReactNode; name: string }) {
  const { formatMessage } = useIntl();

  return (
    <DetailsHeader
      action={props.action}
      backTo={ROUTE_PATHS.ADMIN.USERS}
      backThroughHistory
      breadcrumb={
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
          breadcrumb={{
            currentPageLabel: props.name,
            segments: [
              { label: formatMessage({ defaultMessage: 'Administration' }), to: {} },
              {
                label: formatMessage({ defaultMessage: 'Gérer les utilisateurs' }),
                to: ROUTE_PATHS.ADMIN.USERS,
              },
            ],
          }}
          className="fr-mt-0"
          id="administration-breadcrumb"
        />
      }
      overline={<FormattedMessage defaultMessage="Fiche utilisateur" />}
      title={props.name}
    />
  );
}

function ImpersonateButton(props: { userId: string }) {
  const tab = useTab();
  const { isPending, mutate: impersonate } = useImpersonateMutation({ userId: props.userId });
  const onClick = useCallback(() => {
    impersonate(undefined, {
      onSuccess() {
        const url = new URL(generatePath(ROUTE_PATHS.TRANSPARENCES.DASHBOARD), window.location.href);
        tab.open(url);
      },
    });
  }, [impersonate, tab]);

  return (
    <Button
      className="btn-compact"
      disabled={isPending}
      iconId="ri-user-shared-fill"
      onClick={onClick}
      priority="secondary"
      size="small"
    >
      <FormattedMessage defaultMessage="Se connecter en tant que" />
    </Button>
  );
}

function AdminLoadedUserDetail(props: { user: DetailedAdminUserDto }) {
  const { user } = props;
  return (
    <DetailsPageLayout
      background={user.role.group === 'SECRETARIAT' ? 'cafeCreme' : 'blueFrance'}
      header={
        <AdminUserDetailHeader
          action={user.canImpersonate ? <ImpersonateButton userId={user.id} /> : undefined}
          name={memberFullName(user)}
        />
      }
      identity={
        <>
          <DetailsCard>
            <h2 className="fr-h4">
              <FormattedMessage defaultMessage="Titre affiché" />
            </h2>
            <dl className="m-0 p-0">
              <DisplayTitleField user={user} />
            </dl>
          </DetailsCard>

          <AccessCard user={user} />
        </>
      }
      identityPosition="right"
      wideIdentity
    >
      <DetailsCard className="grow">
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Compte" />
        </h2>
        <dl className="m-0 flex flex-col gap-y-6 p-0">
          <EmailField user={user} />
          <PasswordField user={user} />
          <RoleField user={user} />
        </dl>
      </DetailsCard>
    </DetailsPageLayout>
  );
}

export function AdminUserDetailPage() {
  const { userId } = useParams();
  const { data: user, isError, isLoading } = useAdminUserDetailQuery(userId);

  if (isLoading) {
    return (
      <div className="fr-container fr-py-8v">
        <p>
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </div>
    );
  }

  if (isError || !user || !userId) {
    return (
      <div className="fr-container fr-py-8v">
        <FormattedMessage defaultMessage="Utilisateur introuvable" />
      </div>
    );
  }

  return <AdminLoadedUserDetail user={user} />;
}
