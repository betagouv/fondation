import Button from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import React, { useId, useState } from 'react';
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

import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { RoleEnumLabels } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';

type Role = DetailedAdminUserDto['role'];
type Title = DetailedAdminUserDto['title'];
type Duty = DetailedAdminUserDto['duty'];

const TITLE_LABELS: Record<Title, string> = {
  PRESIDENT_SIEGE: 'Président Siège',
  PRESIDENT_PARQUET: 'Président Parquet',
  FIRST_SECRETARY: 'Premier Secrétaire'
};

const DUTY_LABELS: Record<Duty, string> = {
  PRESIDENT: 'Président',
  SECRETARY: 'Secrétaire',
  OFFICER: 'Officier'
};

const ALL_ROLES: Role[] = [
  'ADMIN',
  'ADJOINT_SECRETAIRE_GENERAL',
  'MEMBRE_COMMUN',
  'MEMBRE_DU_PARQUET',
  'MEMBRE_DU_SIEGE'
];

function EmailField(props: { userId: string; currentEmail: string }) {
  const id = useId();
  const [isEditing, setEditing] = useState(false);
  const [email, setEmail] = useState(props.currentEmail);
  const { mutate, isPending, error } = useUpdateUserEmailMutation(props.userId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed === props.currentEmail) {
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
        ) : (
          <Button
            onClick={() => setEditing(true)}
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
            state={error ? 'error' : undefined}
            stateRelatedMessage={error ? "Erreur à la mise à jour de l'email" : undefined}
            nativeInputProps={{
              id,
              type: 'email',
              autoFocus: true,
              autoComplete: 'off',
              value: email,
              onChange: (e) => setEmail(e.target.value)
            }}
          />
        </form>
      ) : (
        <dd className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">{props.currentEmail}</dd>
      )}
    </div>
  );
}

function PasswordField(props: { userId: string }) {
  const id = useId();
  const [isEditing, setEditing] = useState(false);
  const [password, setPassword] = useState('');
  const { mutate, isPending, error } = useUpdateUserPasswordMutation(props.userId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    mutate(
      { password: password.trim() },
      {
        onSuccess: () => {
          setEditing(false);
          setPassword('');
        }
      }
    );
  };

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Mot de passe</dt>
        {isEditing ? (
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
        ) : (
          <Button
            onClick={() => setEditing(true)}
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
            state={error ? 'error' : undefined}
            stateRelatedMessage={error ? 'Erreur à la mise à jour du mot de passe' : undefined}
            nativeInputProps={{
              id,
              type: 'password',
              autoFocus: true,
              autoComplete: 'new-password',
              value: password,
              onChange: (e) => setPassword(e.target.value),
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

function RoleField(props: { userId: string; currentRole: Role; isSelf: boolean }) {
  const [isEditing, setEditing] = useState(false);
  const [role, setRole] = useState<Role>(props.currentRole);
  const { mutateAsync, isPending, error } = useUpdateUserRoleMutation(props.userId);
  const { mutateAsync: logoutMutateAsync } = useLogout();
  const confirmation = useConfirmation();
  const navigate = useNavigate();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === props.currentRole) {
      setEditing(false);
      return;
    }

    const isSelfDemotion = props.isSelf && role !== 'ADMIN';
    if (isSelfDemotion) {
      const { isConfirmed } = await confirmation.waitForConfirmation({
        title: 'Vous allez perdre vos droits administrateur',
        content: 'Cette action modifie votre rôle. Vous serez déconnecté immédiatement.'
      });
      if (!isConfirmed) return;
    }

    await mutateAsync({ role });
    setEditing(false);

    if (isSelfDemotion) {
      await logoutMutateAsync();
      navigate(ROUTE_PATHS.LOGIN);
    }
  };

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Rôle</dt>
        {isEditing ? (
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
            value: role,
            autoFocus: true,
            onChange: (e) => setRole(e.target.value as Role)
          }}
        >
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {RoleEnumLabels[r]}
            </option>
          ))}
        </Select>
      ) : (
        <dd className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">
          {RoleEnumLabels[props.currentRole]}
        </dd>
      )}
    </div>
  );
}

function TitleField(props: { userId: string; currentTitle: Title; user: DetailedAdminUserDto }) {
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState<Title | ''>(props.currentTitle ?? '');
  const { mutateAsync, isPending, error } = useUpdateUserTitleMutation(props.userId);
  const confirmation = useConfirmation();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTitle = title || null;

    if (newTitle === props.currentTitle) {
      setEditing(false);
      return;
    }

    if (newTitle) {
      const { isConfirmed } = await confirmation.waitForConfirmation({
        title: 'Ce titre sera affecté à cet utilisateur uniquement',
        content: `Ce titre sera affecté à ${props.user.firstName} ${props.user.lastName} uniquement`
      });
      if (!isConfirmed) return;
    }

    try {
      await mutateAsync({ title: newTitle as Title });
      setEditing(false);
    } catch {
      // error is captured in hook's error state
    }
  };

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Titre fonctionnel</dt>
        {isEditing ? (
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
        ) : (
          <Button
            onClick={() => setEditing(true)}
            disabled={isPending}
            title="Modifier le titre"
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
          stateRelatedMessage={error ? 'Erreur à la mise à jour du titre' : undefined}
          nativeSelectProps={{
            value: title,
            autoFocus: true,
            onChange: (e) => setTitle(e.target.value as Title | '')
          }}
        >
          <option value="">Aucun</option>
          {(Object.keys(TITLE_LABELS) as Title[]).map((t) => (
            <option key={t} value={t}>
              {TITLE_LABELS[t]}
            </option>
          ))}
        </Select>
      ) : (
        <dd className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">
          {props.currentTitle ? (
            TITLE_LABELS[props.currentTitle]
          ) : (
            <span className="text-gray-400">Aucun</span>
          )}
        </dd>
      )}
    </div>
  );
}

function DisplayTitleField(props: { userId: string; currentDisplayTitle: string | null }) {
  const id = useId();
  const [isEditing, setEditing] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(props.currentDisplayTitle ?? '');
  const { mutate, isPending, error } = useUpdateUserDisplayTitleMutation(props.userId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newTitle = displayTitle.trim() || null;
    if (newTitle === props.currentDisplayTitle) {
      setEditing(false);
      return;
    }
    mutate({ displayTitle: newTitle }, { onSuccess: () => setEditing(false) });
  };

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Titre affiché</dt>
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
            onClick={() => setEditing(true)}
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
              id,
              autoFocus: true,
              autoComplete: 'off',
              value: displayTitle,
              onChange: (e) => setDisplayTitle(e.target.value),
              placeholder: 'Saisissez un titre...'
            }}
          />
        </form>
      ) : (
        <div id={id} className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">
          {displayTitle || <span className="text-gray-400">Aucun titre</span>}
        </div>
      )}
    </div>
  );
}

function DutyField(props: { userId: string; currentDuty: Duty }) {
  const [isEditing, setEditing] = useState(false);
  const [duty, setDuty] = useState<Duty | ''>(props.currentDuty ?? '');
  const { mutateAsync, isPending, error } = useUpdateUserDutyMutation(props.userId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDuty = duty || null;
    if (newDuty === props.currentDuty) {
      setEditing(false);
      return;
    }
    try {
      await mutateAsync({ duty: newDuty as Duty });
      setEditing(false);
    } catch {
      // error is captured in hook's error state
    }
  };

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <dt className="font-bold">Fonction</dt>
        {isEditing ? (
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
            value: duty,
            autoFocus: true,
            onChange: (e) => setDuty(e.target.value as Duty | '')
          }}
        >
          <option value="">Aucune</option>
          {(Object.keys(DUTY_LABELS) as Duty[]).map((d) => (
            <option key={d} value={d}>
              {DUTY_LABELS[d]}
            </option>
          ))}
        </Select>
      ) : (
        <dd className="mt-2 rounded border border-gray-300 bg-gray-50 p-4">
          {props.currentDuty ? DUTY_LABELS[props.currentDuty] : <span className="text-gray-400">Aucune</span>}
        </dd>
      )}
    </div>
  );
}

export function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.userId;
  const { data: user, isLoading, isError } = useAdminUserDetailQuery(userId);
  const { user: currentUser } = useUser();

  if (isLoading) return <div className="fr-container py-8">Chargement...</div>;
  if (isError || !user || !userId) return <div className="fr-container py-8">Utilisateur introuvable.</div>;

  return (
    <div className="mx-auto max-w-2xl pb-12 pt-4">
      <h1 className="fr-display-xl text-center">
        {`${capitalize(user.firstName)} ${user.lastName.toUpperCase()}`}
      </h1>

      <article className="mt-16 flex flex-col gap-y-8">
        <section>
          <h2 className="fr-display-xs">Compte</h2>
          <dl className="flex flex-col gap-y-4">
            <EmailField userId={userId} currentEmail={user.email} />
            <PasswordField userId={userId} />
          </dl>
        </section>

        <section>
          <h2 className="fr-display-xs">Rôle</h2>
          <dl className="flex flex-col gap-y-4">
            <RoleField userId={userId} currentRole={user.role} isSelf={currentUser?.id === userId} />
          </dl>
        </section>

        <section>
          <h2 className="fr-display-xs">Titre</h2>
          <dl className="flex flex-col gap-y-4">
            <TitleField userId={userId} currentTitle={user.title} user={user} />
            <DisplayTitleField userId={userId} currentDisplayTitle={user.displayTitle} />
            <DutyField userId={userId} currentDuty={user.duty} />
          </dl>
        </section>
      </article>
    </div>
  );
}
