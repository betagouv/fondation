import Button, { type ButtonProps } from '@codegouvfr/react-dsfr/Button';
import { type CSSProperties } from 'react';

import type { HeadingLevel } from '../extensions/constant';
import { useIsBlurred } from '../hooks/useIsBlurred';
import { useMarkPriority } from '../hooks/useMarkPriority';

type EditorButtonProps = {
  mark?: string;
  attributes?: { level: HeadingLevel };
  title: string;
  onClick: () => void;
  disabled: boolean;
  style?: CSSProperties;
} & Required<Pick<ButtonProps.WithIcon, 'iconId' | 'title'>>;

export function EditorButton(props: EditorButtonProps) {
  const { onClick, disabled, mark, title, attributes, ...dsfrProps } = props;

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
