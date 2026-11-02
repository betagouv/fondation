import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
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

import { RecusedMembers } from './RecusedMembers';

const SESSION_ID = 'session-1';
const PRESIDENT = { firstName: 'Zoé', id: 'president', lastName: 'Zola' };
const MEMBER = { firstName: 'Jean', id: 'member', lastName: 'Albert' };

function renderRecusedMembers(recusedMembers: RecusedMembersDto['recusedMembers'], canRecuseMembers = true) {
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
            nominationFile={makeSessionNominationFile({ canRecuseMembers, recusedMembers: members })}
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

describe('RecusedMembers', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the recused members in the order the API serves them', async () => {
    const { container } = renderRecusedMembers([PRESIDENT, MEMBER]);

    const removals = screen.getAllByRole('button', { name: /^Retirer/ });
    expect(removals.map((button) => button.textContent)).toEqual(['Retirer Zoé ZOLA', 'Retirer Jean ALBERT']);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('saves every recused member when one more is added', async () => {
    const recuse = vi
      .spyOn($api.sessions, 'recuseMembers')
      .mockResolvedValue({ data: { recusedMembers: [PRESIDENT, MEMBER] } } as Awaited<
        ReturnType<typeof $api.sessions.recuseMembers>
      >);
    const user = userEvent.setup();
    renderRecusedMembers([PRESIDENT]);

    await user.click(screen.getByRole('button', { name: /Ajouter un membre qui se déporte/ }));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Jean ALBERT' }));

    await waitFor(() => expect(recuse).toHaveBeenCalledTimes(1));
    expect(recuse).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { memberIds: [PRESIDENT.id, MEMBER.id] },
        path: { nominationFileId: 'nomination-file', sessionId: SESSION_ID },
      }),
    );
  });

  it('keeps the recused members another action saved while the panel was open', async () => {
    const recuse = vi
      .spyOn($api.sessions, 'recuseMembers')
      .mockResolvedValue({ data: { recusedMembers: [PRESIDENT, MEMBER] } } as Awaited<
        ReturnType<typeof $api.sessions.recuseMembers>
      >);
    const user = userEvent.setup();
    const { rerender } = renderRecusedMembers([]);
    rerender([PRESIDENT]);

    await user.click(screen.getByRole('button', { name: /Ajouter un membre qui se déporte/ }));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Jean ALBERT' }));

    await waitFor(() =>
      expect(recuse).toHaveBeenCalledWith(
        expect.objectContaining({ body: { memberIds: [PRESIDENT.id, MEMBER.id] } }),
      ),
    );
  });

  it('withdraws a recused member', async () => {
    const withdrawn: RecusedMembersDto = { recusedMembers: [] };
    const recuse = vi
      .spyOn($api.sessions, 'recuseMembers')
      .mockResolvedValue({ data: withdrawn } as Awaited<ReturnType<typeof $api.sessions.recuseMembers>>);
    const user = userEvent.setup();
    renderRecusedMembers([MEMBER]);

    await user.click(screen.getByRole('button', { name: 'Retirer Jean ALBERT' }));

    await waitFor(() =>
      expect(recuse).toHaveBeenCalledWith(expect.objectContaining({ body: { memberIds: [] } })),
    );
  });

  it('no longer changes the recused members once the API locks them', () => {
    renderRecusedMembers([MEMBER], false);

    expect(screen.getByRole('button', { name: 'Retirer Jean ALBERT' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Ajouter un membre qui se déporte/ })).toBeDisabled();
  });
});
