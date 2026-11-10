import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { FormationEnum } from '@/shared/enums/formation.enum';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import * as $api from '@api/sdk';
import type { RecusedMembersDto } from '@api/types';
import { memberKeys } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { RecusedMembers } from './RecusedMembers';

const SESSION_ID = 'session-1';
const PRESIDENT = { firstName: 'Zoé', id: 'president', lastName: 'Zola' };
const MEMBER = { firstName: 'Jean', id: 'member', lastName: 'Albert' };

function renderRecusedMembers(
  recusedMembers: RecusedMembersDto['recusedMembers'],
  file: Partial<Pick<SessionNominationFile, 'canRecuseMembers' | 'nonRecusableMembers'>> = {},
) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  client.setQueryData(
    memberKeys.listMembers({
      formations: ['COMMUN', FormationEnum.SIEGE],
      pagination: { pageIndex: 0, pageSize: 100 },
    }),
    {
      items: [MEMBER, PRESIDENT].map((member) => ({
        ...member,
        excludedJurisdictions: [],
        status: 'ACTIVE',
      })),
    },
  );

  const panel = (members: RecusedMembersDto['recusedMembers']) => (
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <NominationFilesTableProvider
          canManage
          formation={FormationEnum.SIEGE}
          outcomes={makeSessionOutcomes(FormationEnum.SIEGE)}
          sessionId={SESSION_ID}
        >
          <RecusedMembers
            nominationFile={makeSessionNominationFile({
              canRecuseMembers: true,
              nonRecusableMembers: [],
              ...file,
              recusedMembers: members,
            })}
            recusedMembers={members}
          />
        </NominationFilesTableProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
  const result = render(panel(recusedMembers));

  return {
    ...result,
    rerender: (members: RecusedMembersDto['recusedMembers']) => result.rerender(panel(members)),
  };
}

function mockRecusal(recusedMembers: RecusedMembersDto['recusedMembers']) {
  return vi
    .spyOn($api.sessions, 'recuseMembers')
    .mockResolvedValue({ data: { recusedMembers } } as Awaited<
      ReturnType<typeof $api.sessions.recuseMembers>
    >);
}

const field = () => screen.getByRole('combobox', { name: /Ajouter un membre qui se déporte/ });

describe('RecusedMembers', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the recused members in the order the API serves them', async () => {
    const { container } = renderRecusedMembers([PRESIDENT, MEMBER]);

    const removals = screen.getAllByRole('button', { name: /^Retirer le déport/ });
    expect(removals.map((button) => button.textContent)).toEqual(['Zoé ZOLA', 'Jean ALBERT']);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('saves every recused member when one more is added', async () => {
    const recuse = mockRecusal([PRESIDENT, MEMBER]);
    const user = userEvent.setup();
    renderRecusedMembers([PRESIDENT]);

    await user.selectOptions(field(), 'Jean ALBERT');

    await waitFor(() => expect(recuse).toHaveBeenCalledTimes(1));
    expect(recuse).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { memberIds: [PRESIDENT.id, MEMBER.id] },
        path: { nominationFileId: 'nomination-file', sessionId: SESSION_ID },
      }),
    );
  });

  it('greys out a reporter of the file and tells why', () => {
    renderRecusedMembers([], { nonRecusableMembers: [{ id: MEMBER.id, reason: 'REPORTER' }] });

    expect(screen.getByRole('option', { name: 'Jean ALBERT (rapporteur)' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Zoé ZOLA' })).toBeEnabled();
    expect(field()).toHaveAccessibleName(
      /Un rapporteur ne peut pas se déporter : retirez-le d'abord de l'affectation, puis publiez-la s'il est rapporteur dans la version publiée\.$/,
    );
  });

  it('keeps the recused members another action saved while the panel was open', async () => {
    const recuse = mockRecusal([PRESIDENT, MEMBER]);
    const user = userEvent.setup();
    const { rerender } = renderRecusedMembers([]);
    rerender([PRESIDENT]);

    await user.selectOptions(field(), 'Jean ALBERT');

    await waitFor(() =>
      expect(recuse).toHaveBeenCalledWith(
        expect.objectContaining({ body: { memberIds: [PRESIDENT.id, MEMBER.id] } }),
      ),
    );
  });

  it('withdraws a recused member, even a reporter', async () => {
    const recuse = mockRecusal([]);
    const user = userEvent.setup();
    renderRecusedMembers([MEMBER], { nonRecusableMembers: [{ id: MEMBER.id, reason: 'REPORTER' }] });

    await user.click(screen.getByRole('button', { name: 'Retirer le déport de Jean ALBERT' }));

    await waitFor(() =>
      expect(recuse).toHaveBeenCalledWith(expect.objectContaining({ body: { memberIds: [] } })),
    );
  });

  it('no longer changes the recused members once the API locks them', () => {
    renderRecusedMembers([MEMBER], { canRecuseMembers: false });

    expect(screen.getByRole('button', { name: 'Retirer le déport de Jean ALBERT' })).toBeDisabled();
    expect(field()).toBeDisabled();
  });
});
