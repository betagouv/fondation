import { act, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedbackInvitation } from './FeedbackInvitation';

const waitForConfirmation = vi.fn();

vi.mock('@/shared/context/confirm-modal', () => ({ useConfirmModal: () => ({ waitForConfirmation }) }));
vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'user-1' } }) }));
const feedback = vi.hoisted(() => ({
  current: { last: null, questionnaire: 'MEMBER', status: 'NOT_ANSWERED' },
}));
vi.mock('@queries/feedback.queries', () => ({ useFeedbackQuery: () => ({ data: feedback.current }) }));

function renderInvitation() {
  const router = createMemoryRouter([{ element: <FeedbackInvitation />, path: '*' }], {
    initialEntries: ['/transparences'],
  });
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <RouterProvider router={router} />
    </IntlProvider>,
  );
  return { navigate: (to: string) => act(() => router.navigate(to)) };
}

describe('FeedbackInvitation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    localStorage.clear();
    waitForConfirmation.mockReset().mockResolvedValue({ isConfirmed: false });
    feedback.current = { last: null, questionnaire: 'MEMBER', status: 'NOT_ANSWERED' };
  });

  afterEach(() => vi.useRealTimers());

  it('asks nothing on opening Fondation, nor on a page change right after', async () => {
    const { navigate } = renderInvitation();

    await navigate('/transparences/sessions');

    expect(waitForConfirmation).not.toHaveBeenCalled();
  });

  it('asks on the first page change after a few minutes of use, then not again the same day', async () => {
    const { navigate } = renderInvitation();

    act(() => vi.advanceTimersByTime(5 * 60_000));
    expect(waitForConfirmation).not.toHaveBeenCalled();
    await navigate('/transparences/sessions');
    await navigate('/transparences');

    expect(waitForConfirmation).toHaveBeenCalledOnce();
  });

  it.each(['PREVIEW', 'TEST'])('never asks an admin, whose status is %s', async (status) => {
    feedback.current = { last: null, questionnaire: 'SECRETARIAT', status };
    const { navigate } = renderInvitation();

    act(() => vi.advanceTimersByTime(5 * 60_000));
    await navigate('/transparences/sessions');

    expect(waitForConfirmation).not.toHaveBeenCalled();
  });
});
