import Button, { type ButtonProps } from '@codegouvfr/react-dsfr/Button';
import type { FC } from 'react';
import type { HeadingLevel } from '../extensions/constant';
import { useIsBlurred } from '../hooks/useIsBlurred';
import { useMarkPriority } from '../hooks/useMarkPriority';

export type EditorButtonProps = {
  mark?: string;
  attributes?: { level: HeadingLevel };
  title: string;
  onClick: () => void;
  disabled: boolean;
  style?: React.CSSProperties;
} & Required<Pick<ButtonProps.WithIcon, 'iconId' | 'title'>>;

export const EditorButton: FC<EditorButtonProps> = (props) => {
  const { onClick, disabled, mark, title, attributes, ...dsfrProps } = props;

  const markPriority = useMarkPriority(mark, attributes);
  const isBlurred = useIsBlurred();

  const isDisabled = isBlurred || disabled;

  return (
    <Button
      onClick={onClick}
      size="small"
      priority={markPriority}
      title={title}
      disabled={isDisabled}
      {...dsfrProps}
    />
  );
};
