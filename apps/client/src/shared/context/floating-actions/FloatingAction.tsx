import { type ReactNode, useContext } from 'react';
import { createPortal } from 'react-dom';

import { FloatingActionsContext } from './FloatingActionsContext';

export function FloatingAction(props: { children: ReactNode }) {
  const stack = useContext(FloatingActionsContext)?.stack;

  return stack ? createPortal(props.children, stack) : null;
}
