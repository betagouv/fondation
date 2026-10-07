import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import type { Feedback } from '@queries/feedback.queries';

import { FeedbackForm } from './FeedbackForm';

function renderForm(questionnaire: Feedback['questionnaire']) {
  const onSubmit = vi.fn();
  const router = createMemoryRouter([
    {
      element: (
        <>
          <Link to="/ailleurs">Ailleurs</Link>
          <FeedbackForm isSubmitting={false} onSubmit={onSubmit} questionnaire={questionnaire} />
        </>
      ),
      path: '/',
    },
    { element: <p>Page ailleurs</p>, path: '/ailleurs' },
  ]);
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <ConfirmModalProvider>
        <RouterProvider router={router} />
      </ConfirmModalProvider>
    </IntlProvider>,
  );
  return { onSubmit, user: userEvent.setup() };
}

async function next(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Étape suivante|Envoyer mon avis/ }));
}

describe('FeedbackForm', () => {
  it('asks a member one question per step, then sends the answers', async () => {
    const { onSubmit, user } = renderForm('MEMBER');

    await user.click(screen.getByLabelText('4'));
    await next(user);
    await user.click(screen.getByLabelText('8'));
    await next(user);
    await user.click(screen.getByLabelText('10 à 25 %'));
    await next(user);
    await user.click(screen.getByLabelText('Au moins une fois'));
    await next(user);
    await user.click(screen.getByLabelText('Partiellement'));
    await next(user);
    await user.type(screen.getByLabelText(/ralenti ou gêné/), '  La recherche des dossiers ');
    await next(user);

    expect(onSubmit).toHaveBeenCalledWith({
      easeRating: 4,
      hindrance: 'La recherche des dossiers',
      member: {
        debateContribution: 'AT_LEAST_ONCE',
        manualWorkShare: 'FROM_10_TO_25',
        reviewThoroughness: 'PARTIALLY',
      },
      satisfactionRating: 8,
      secretariat: null,
    });
  });

  it('asks the secretariat what the other tool was for once one was used', async () => {
    const { onSubmit, user } = renderForm('SECRETARIAT');

    await user.click(screen.getByLabelText('3'));
    await next(user);
    await user.click(screen.getByLabelText('6'));
    await next(user);
    await user.click(screen.getByLabelText('Moins de 10 %'));
    await next(user);
    expect(screen.queryByLabelText(/pour quoi faire/)).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Oui, ponctuellement'));
    await user.type(screen.getByLabelText(/pour quoi faire/), 'Le tableur des auditions');
    await next(user);
    await next(user);

    expect(onSubmit).toHaveBeenCalledWith({
      easeRating: 3,
      hindrance: null,
      member: null,
      satisfactionRating: 6,
      secretariat: {
        manualWorkShare: 'LESS_THAN_10',
        otherToolPurpose: 'Le tableur des auditions',
        otherToolUsage: 'OCCASIONALLY',
      },
    });
  });

  it('keeps the answer of a step when coming back to it', async () => {
    const { user } = renderForm('MEMBER');

    await user.click(screen.getByLabelText('4'));
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Étape précédente' }));

    expect(screen.getByLabelText('4')).toBeChecked();
  });

  it('does not move on without an answer', async () => {
    const { user } = renderForm('MEMBER');

    await next(user);

    expect(screen.getByText(/facile à utiliser/)).toBeInTheDocument();
  });

  it('warns before leaving a questionnaire already started', async () => {
    const { user } = renderForm('MEMBER');

    await user.click(screen.getByLabelText('4'));
    await user.click(screen.getByRole('link', { name: 'Ailleurs' }));
    await user.click(await screen.findByRole('button', { name: 'Continuer le questionnaire' }));

    expect(screen.queryByText('Page ailleurs')).not.toBeInTheDocument();
    expect(screen.getByLabelText('4')).toBeChecked();
  });

  it('leaves a questionnaire already started once the leaving is confirmed', async () => {
    const { user } = renderForm('MEMBER');

    await user.click(screen.getByLabelText('4'));
    await user.click(screen.getByRole('link', { name: 'Ailleurs' }));
    await user.click(await screen.findByRole('button', { name: 'Quitter' }));

    expect(await screen.findByText('Page ailleurs')).toBeInTheDocument();
  });

  it('leaves freely a questionnaire not started', async () => {
    const { user } = renderForm('MEMBER');

    await user.click(screen.getByRole('link', { name: 'Ailleurs' }));

    expect(await screen.findByText('Page ailleurs')).toBeInTheDocument();
  });
});
