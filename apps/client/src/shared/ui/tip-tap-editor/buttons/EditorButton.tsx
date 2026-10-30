import Button, { type ButtonProps } from '@codegouvfr/react-dsfr/Button';
import { type CSSProperties } from 'react';

import { useIsBlurred } from '../hooks/useIsBlurred';
import { useMarkPriority } from '../hooks/useMarkPriority';

type EditorButtonProps = {
  attributes?: Record<string, unknown>;
  disabled: boolean;
  mark?: string;
  onClick: () => void;
  style?: CSSProperties;
  title: string;
} & Required<Pick<ButtonProps.WithIcon, 'iconId' | 'title'>>;

export function EditorButton(props: EditorButtonProps) {
  const { attributes, disabled, mark, onClick, title, ...dsfrProps } = props;

  const markPriority = useMarkPriority(mark, attributes);
  const isBlurred = useIsBlurred();

  const isDisabled = isBlurred || disabled;

  return (
    <Button
      disabled={isDisabled}
      onClick={onClick}
      priority={markPriority}
      size="small"
      title={title}
      {...dsfrProps}
    />
  );
}
