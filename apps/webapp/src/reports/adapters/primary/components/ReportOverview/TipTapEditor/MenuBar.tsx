import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { useCurrentEditor } from "@tiptap/react";
import clsx from "clsx";
import { BoldButton } from "./buttons/BoldButton";
import { BulletListButton } from "./buttons/BulletListButton";
import { HeadingButton } from "./buttons/HeadingButton";
import { HighlightButton } from "./buttons/HighlightButton";
import { ImageUploadButton } from "./buttons/ImageUploadButton";
import { IndentDecreaseButton } from "./buttons/IndentDecreaseButton";
import { IndentIncreaseButton } from "./buttons/IndentIncreaseButton";
import { ItalicButton } from "./buttons/ItalicButton";
import { OrderedListButton } from "./buttons/OrderedListButton";
import { TextColorButton } from "./buttons/TextColorButton";
import { UnderlineButton } from "./buttons/UnderlineButton";
import { headingLevels } from "./constant";

export const MenuBar = () => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <div className={clsx("sticky top-2 z-10 bg-white", cx("fr-my-4v"))}>
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
        <ImageUploadButton />
      </div>
    </div>
  );
};
