import { useCallback, useEffect, useRef, useState } from 'react';

export type AwaitableModalState<TQuestion, TAnswer> =
  | { id: number; question: TQuestion; settle: (answer: TAnswer) => void; status: 'asking' }
  | { id: number; question: TQuestion; status: 'answered' }
  | { status: 'idle' };

/**
 * Turns a modal into an awaitable question: `ask` resolves once the caller answers.
 * `unanswered` settles a question that a new one supersedes, so nobody awaits forever.
 */
export function useAwaitableModal<TQuestion, TAnswer>(unanswered: TAnswer) {
  const [state, setState] = useState<AwaitableModalState<TQuestion, TAnswer>>({ status: 'idle' });
  const pending = useRef<((answer: TAnswer) => void) | null>(null);
  const lastId = useRef(0);

  const superseded = useRef(unanswered);
  useEffect(() => {
    superseded.current = unanswered;
  });

  const ask = useCallback(
    (question: TQuestion) =>
      new Promise<TAnswer>((resolve) => {
        pending.current?.(superseded.current);
        pending.current = resolve;
        lastId.current += 1;

        setState({ id: lastId.current, question, settle: resolve, status: 'asking' });
      }),
    [],
  );

  const answer = useCallback(
    (value: TAnswer) => {
      if (state.status !== 'asking') return;

      pending.current = null;
      state.settle(value);
      setState({ id: state.id, question: state.question, status: 'answered' });
    },
    [state],
  );

  /**
   * The modal finished fading out: nothing is left to render. A question asked while it was
   * still fading survives, its `ask` having landed before React ran the fade timer's cleanup.
   */
  const forget = useCallback(
    () => setState((current) => (current.status === 'answered' ? { status: 'idle' } : current)),
    [],
  );

  return { answer, ask, forget, state };
}
