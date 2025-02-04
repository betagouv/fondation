import Button, { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { useMarkPriority } from "../useMarkPriority";
import { Editor, useCurrentEditor } from "@tiptap/react";
import { FC } from "react";
import { useIsBlurred } from "../useIsBlurred";
import { HeadingLevel } from "../constant";

export const EditorButton: FC<
  {
    mark?: string;
    attributes?: { level: HeadingLevel };
    title: string;
    onClickFactory: (editor: Editor) => () => void;
    disabledFactory: (editor: Editor) => boolean;
  } & Required<Pick<ButtonProps.WithIcon, "iconId" | "title">>
> = (props) => {
  const {
    onClickFactory,
    disabledFactory,
    mark,
    title,
    attributes,
    ...dsfrProps
  } = props;

  const markPriority = useMarkPriority(mark, attributes);
  const { editor } = useCurrentEditor();
  const isBlurred = useIsBlurred();

  if (!editor) {
    return null;
  }

  const disabled = isBlurred || disabledFactory(editor);

  return (
    <Button
      onClick={onClickFactory(editor)}
      size="medium"
      priority={markPriority}
      title={title}
      disabled={disabled}
      {...dsfrProps}
    />
  );
};
