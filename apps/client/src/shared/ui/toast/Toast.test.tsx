import Button from '@codegouvfr/react-dsfr/Button';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from './ToastRegion';
import { useToasts, type ToastNotice } from './useToasts';

function Trigger(props: { notice: ToastNotice; tone: 'error' | 'success' }) {
  const toasts = useToasts();

  return <Button onClick={() => toasts[props.tone](props.notice)}>Déclencher</Button>;
}

const notifications = () => screen.getByRole('region', { name: 'Notifications' });
const closeButton = () => within(notifications()).getByRole('button', { name: 'Fermer la notification' });

function renderToast(tone: 'error' | 'success', notice: ToastNotice) {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <ToastProvider>
        <Trigger notice={notice} tone={tone} />
      </ToastProvider>
    </IntlProvider>,
  );

  return {
    reachByKeyboard: () => fireEvent.keyDown(window, { key: 'F6' }),
    trigger: () => fireEvent.click(screen.getByRole('button', { name: 'Déclencher' })),
    wait: (ms: number) => act(() => vi.advanceTimersByTime(ms)),
  };
}

describe('Toast', () => {
  afterEach(() => vi.useRealTimers());

  it('mounts its live region before any message arrives', () => {
    renderToast('success', { title: 'Session publiée' });

    expect(notifications()).toHaveAttribute('aria-live', 'polite');
  });

  it('never moves the focus away from the action that triggered it', () => {
    const { trigger } = renderToast('success', { title: 'Session publiée' });
    const button = screen.getByRole('button', { name: 'Déclencher' });
    button.focus();

    trigger();

    expect(screen.getByText('Session publiée')).toBeInTheDocument();
    expect(document.activeElement).toBe(button);
  });

  it('dismisses a confirmation once its reading time is over', () => {
    vi.useFakeTimers();
    const { trigger, wait } = renderToast('success', { title: 'Session publiée' });

    trigger();
    wait(4_000);
    expect(screen.getByText('Session publiée')).toBeInTheDocument();

    wait(2_000);
    expect(screen.queryByText('Session publiée')).not.toBeInTheDocument();
  });

  it('holds the countdown while the pointer is over the notifications', () => {
    vi.useFakeTimers();
    const { trigger, wait } = renderToast('success', { title: 'Session publiée' });

    trigger();
    fireEvent.mouseEnter(notifications());
    wait(60_000);

    expect(screen.getByText('Session publiée')).toBeInTheDocument();
  });

  it('holds the countdown while the keyboard reaches the notifications', () => {
    vi.useFakeTimers();
    const { reachByKeyboard, trigger, wait } = renderToast('success', { title: 'Session publiée' });

    trigger();
    reachByKeyboard();
    wait(60_000);

    expect(screen.getByText('Session publiée')).toBeInTheDocument();
  });

  it('keeps an error until it is closed, without hiding it from assistive tech', () => {
    vi.useFakeTimers();
    const { trigger, wait } = renderToast('error', { title: 'La publication a échoué' });

    trigger();
    wait(60_000);

    const error = within(notifications()).getByText('La publication a échoué');
    expect(error).toBeInTheDocument();
    expect(error.closest('[aria-hidden="true"]')).toBeNull();

    fireEvent.click(closeButton());
    wait(1_000);
    expect(within(notifications()).queryByText('La publication a échoué')).not.toBeInTheDocument();
  });

  it('leaves the longest reading time to a toast carrying an action', () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const { trigger, wait } = renderToast('success', {
      action: { label: "Voir l'ODJ", onClick },
      title: '3 propositions ajoutées',
    });

    trigger();
    wait(9_000);

    fireEvent.click(within(notifications()).getByRole('button', { name: "Voir l'ODJ" }));
    expect(onClick).toHaveBeenCalled();
  });

  it('dismisses a toast carrying an action once that reading time is over', () => {
    vi.useFakeTimers();
    const { trigger, wait } = renderToast('success', {
      action: { label: "Voir l'ODJ", onClick: vi.fn() },
      title: '3 propositions ajoutées',
    });

    trigger();
    wait(11_000);

    expect(screen.queryByText('3 propositions ajoutées')).not.toBeInTheDocument();
  });
});
