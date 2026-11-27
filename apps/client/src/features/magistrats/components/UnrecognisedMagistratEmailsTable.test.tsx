import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { ToastProvider } from '@/shared/ui/toast';
import { httpAssert } from '@/utils/http-exception';
import * as $api from '@api/sdk';
import type { ListedUnrecognisedMagistratEmailsDto, SearchMagistratsResponseDto } from '@api/types';

import { UnrecognisedMagistratEmailsTable } from './UnrecognisedMagistratEmailsTable';

class NoopObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}
vi.stubGlobal('IntersectionObserver', NoopObserver);
vi.stubGlobal('ResizeObserver', NoopObserver);

const EMAIL = {
  email: 'claire.fontaine@diplomatie.gouv.fr',
  id: 'email-1',
  lastAttemptAt: '2026-11-26T09:12:00.000Z',
};

function listed(): never {
  return {
    data: {
      currentPageIndex: 1,
      items: [EMAIL],
      totalCount: 1,
    } satisfies ListedUnrecognisedMagistratEmailsDto,
  } as never;
}

function found(): never {
  return {
    data: {
      currentPageIndex: 1,
      items: [
        {
          currentPosition: null,
          firstName: 'Claire',
          grade: null,
          gradeAndJurisdiction: null,
          id: 'magistrat-1',
          lastName: 'FONTAINE',
          name: 'Claire FONTAINE',
          status: 'ACTIVE',
          usedName: null,
        },
      ],
      totalCount: 1,
    } satisfies SearchMagistratsResponseDto,
  } as never;
}

function renderTable() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <NuqsTestingAdapter hasMemory>
          <ToastProvider>
            <ConfirmModalProvider>
              <UnrecognisedMagistratEmailsTable />
            </ConfirmModalProvider>
          </ToastProvider>
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('UnrecognisedMagistratEmailsTable', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens on the latest attempt and asks the API to sort by the column picked', async () => {
    const list = vi.spyOn($api.magistrats, 'listUnrecognisedMagistratEmails').mockResolvedValue(listed());
    renderTable();
    const user = userEvent.setup();

    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ sortBy: 'lastAttemptAt', sortDesc: 'true' }),
        }),
      ),
    );
    await user.click(await screen.findByRole('button', { name: 'Adresse' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: expect.objectContaining({ sortBy: 'email', sortDesc: undefined }) }),
      ),
    );
  });

  it('attaches an address to the magistrat picked', async () => {
    vi.spyOn($api.magistrats, 'listUnrecognisedMagistratEmails').mockResolvedValue(listed());
    vi.spyOn($api.magistrats, 'searchMagistrats').mockResolvedValue(found());
    const attach = vi
      .spyOn($api.magistrats, 'attachUnrecognisedMagistratEmail')
      .mockResolvedValue({} as never);
    const { container } = renderTable();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: `Rattacher ${EMAIL.email}` }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('combobox', { name: /Magistrat/ }), 'FONTAINE');
    await user.click(await within(dialog).findByRole('option', { name: /Claire FONTAINE/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Rattacher' }));

    await waitFor(() =>
      expect(attach).toHaveBeenCalledWith(
        expect.objectContaining({ body: { magistratId: 'magistrat-1' }, path: { id: EMAIL.id } }),
      ),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('tells an inactive magistrat apart in the search', async () => {
    vi.spyOn($api.magistrats, 'listUnrecognisedMagistratEmails').mockResolvedValue(listed());
    const inactive = found() as { data: SearchMagistratsResponseDto };
    inactive.data.items[0]!.status = 'INACTIVE';
    vi.spyOn($api.magistrats, 'searchMagistrats').mockResolvedValue(inactive as never);
    renderTable();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: `Rattacher ${EMAIL.email}` }));
    await user.type(within(await screen.findByRole('dialog')).getByRole('combobox'), 'FONTAINE');

    expect(await screen.findByRole('option', { name: /Claire FONTAINE Inactif/ })).toBeInTheDocument();
  });

  it('opens the results again when the search gets the focus back', async () => {
    vi.spyOn($api.magistrats, 'listUnrecognisedMagistratEmails').mockResolvedValue(listed());
    vi.spyOn($api.magistrats, 'searchMagistrats').mockResolvedValue(found());
    renderTable();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: `Rattacher ${EMAIL.email}` }));
    const dialog = await screen.findByRole('dialog');
    const search = within(dialog).getByRole('combobox', { name: /Magistrat/ });
    await user.type(search, 'FONTAINE');
    await within(dialog).findByRole('option', { name: /Claire FONTAINE/ });
    await user.click(within(dialog).getByRole('heading'));
    await user.click(search);

    expect(await within(dialog).findByRole('option', { name: /Claire FONTAINE/ })).toBeInTheDocument();
  });

  it('keeps the refusal readable once a colleague attached the address first', async () => {
    const list = vi
      .spyOn($api.magistrats, 'listUnrecognisedMagistratEmails')
      .mockResolvedValueOnce(listed())
      .mockResolvedValue({ data: { currentPageIndex: 1, items: [], totalCount: 0 } } as never);
    vi.spyOn($api.magistrats, 'searchMagistrats').mockResolvedValue(found());
    vi.spyOn($api.magistrats, 'attachUnrecognisedMagistratEmail').mockImplementation(
      async () =>
        httpAssert(
          new Response(JSON.stringify({ validationError: 'Cette adresse a déjà été traitée' }), {
            status: 409,
          }),
        ) as never,
    );
    renderTable();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: `Rattacher ${EMAIL.email}` }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('combobox', { name: /Magistrat/ }), 'FONTAINE');
    await user.click(await within(dialog).findByRole('option', { name: /Claire FONTAINE/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Rattacher' }));

    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: `Écarter ${EMAIL.email}` })).not.toBeInTheDocument(),
    );
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
      'Cette adresse a déjà été traitée',
    );
  });

  it('forgets the magistrat chosen once the search changes', async () => {
    vi.spyOn($api.magistrats, 'listUnrecognisedMagistratEmails').mockResolvedValue(listed());
    vi.spyOn($api.magistrats, 'searchMagistrats').mockResolvedValue(found());
    renderTable();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: `Rattacher ${EMAIL.email}` }));
    const dialog = await screen.findByRole('dialog');
    const search = within(dialog).getByRole('combobox', { name: /Magistrat/ });
    await user.type(search, 'FONTAINE');
    await user.click(await within(dialog).findByRole('option', { name: /Claire FONTAINE/ }));
    await user.type(search, ' DUPONT');

    expect(within(dialog).getByRole('button', { name: 'Rattacher' })).toBeDisabled();
  });

  it('gives the focus to the next address once one is set aside', async () => {
    const next = { ...EMAIL, email: 'p.martin@justice.fr', id: 'email-2' };
    vi.spyOn($api.magistrats, 'listUnrecognisedMagistratEmails')
      .mockResolvedValueOnce({ data: { currentPageIndex: 1, items: [EMAIL, next], totalCount: 2 } } as never)
      .mockResolvedValue({ data: { currentPageIndex: 1, items: [next], totalCount: 1 } } as never);
    vi.spyOn($api.magistrats, 'dismissUnrecognisedMagistratEmail').mockResolvedValue({} as never);
    renderTable();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: `Écarter ${EMAIL.email}` }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Écarter' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: `Rattacher ${next.email}` })).toHaveFocus(),
    );
  });

  it('sets an address aside once confirmed', async () => {
    vi.spyOn($api.magistrats, 'listUnrecognisedMagistratEmails').mockResolvedValue(listed());
    const dismiss = vi
      .spyOn($api.magistrats, 'dismissUnrecognisedMagistratEmail')
      .mockResolvedValue({} as never);
    renderTable();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: `Écarter ${EMAIL.email}` }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Écarter' }));

    await waitFor(() =>
      expect(dismiss).toHaveBeenCalledWith(expect.objectContaining({ path: { id: EMAIL.id } })),
    );
  });
});
