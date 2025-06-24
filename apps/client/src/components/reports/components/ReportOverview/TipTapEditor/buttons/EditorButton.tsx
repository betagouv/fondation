import Button, { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { FC } from "react";
import { HeadingLevel } from "../constant";
import { useIsBlurred } from "../useIsBlurred";
import { useMarkPriority } from "../useMarkPriority";

export type EditorButtonProps = {
  mark?: string;
  attributes?: { level: HeadingLevel };
  title: string;
  onClick: () => void;
  disabled: boolean;
} & Required<Pick<ButtonProps.WithIcon, "iconId" | "title">>;

export const EditorButton: FC<EditorButtonProps> = (props) => {
  const { onClick, disabled, mark, title, attributes, ...dsfrProps } = props;

  const markPriority = useMarkPriority(mark, attributes);
  const isBlurred = useIsBlurred();

  const isDisabled = isBlurred || disabled;

  return (
    <Button
      onClick={onClick}
      size="medium"
      priority={markPriority}
      title={title}
      disabled={isDisabled}
      {...dsfrProps}
    />
  );
};
