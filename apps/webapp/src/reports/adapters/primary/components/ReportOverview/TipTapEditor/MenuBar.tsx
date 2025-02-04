import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { useCurrentEditor } from "@tiptap/react";
import clsx from "clsx";
import { BoldButton } from "./buttons/BoldButton";
import { BulletListButton } from "./buttons/BulletListButton";
import { HeadingButton } from "./buttons/HeadingButton";
import { HighlightButton } from "./buttons/HighlightButton";
import { IndentDecreaseButton } from "./buttons/IndentDecreaseButton";
import { IndentIncreaseButton } from "./buttons/IndentIncreaseButton";
import { ItalicButton } from "./buttons/ItalicButton";
import { TextColorButton } from "./buttons/TextColorButton";
import { UnderlineButton } from "./buttons/UnderlineButton";
import { headingLevels } from "./constant";
import { OrderedListButton } from "./buttons/OrderedListButton";

export const MenuBar = () => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <div className={cx("fr-my-4v")}>
      <div className={clsx("gap-3", cx("fr-grid-row"))}>
        <TextColorButton />
        <HighlightButton />
        <BoldButton />
        <ItalicButton />
        <UnderlineButton />
        {headingLevels.map((level) => (
          <HeadingButton key={level} level={level} />
        ))}
        <OrderedListButton />
        <BulletListButton />
        <IndentDecreaseButton />
        <IndentIncreaseButton />
        {/*

     
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          Undo
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          Redo
        </button> */}
      </div>
    </div>
  );
};
