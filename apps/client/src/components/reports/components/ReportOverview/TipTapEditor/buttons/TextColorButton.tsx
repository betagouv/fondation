import Button from "@codegouvfr/react-dsfr/Button";
import { colors } from "@codegouvfr/react-dsfr/fr/colors";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
import type { ChangeEvent } from "react";
import { useRef } from "react";
import { useIsBlurred } from "../useIsBlurred";

export const TextColorButton = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { editor } = useCurrentEditor();
  const isBlurred = useIsBlurred();
  const textColors = colors.getHex({ isDark: false }).decisions.text;
  const currentTextColor = useEditorState({
    editor,
    selector: (ctx) =>
      isBlurred
        ? textColors.disabled.grey.default
        : ctx.editor?.getAttributes("textStyle").color,
  });

  if (!editor) {
    return null;
  }

  const predefinedColors = [
    textColors.default.grey.default,
    textColors.default.success.default,
    textColors.default.error.default,
  ];

  const setColor = (event: ChangeEvent<HTMLInputElement>) =>
    editor.chain().focus().setColor(event.target.value).run();

  const disabled =
    isBlurred || !editor.can().chain().focus().setColor("#000000").run();

  return (
    <div className="relative">
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        size="medium"
        iconId="ri-font-color"
        priority="tertiary"
        title="Couleur du texte"
        style={{
          color: currentTextColor,
        }}
      />
      <input
        ref={inputRef}
        // L'input est positionné de façon absolue, relativement au div parent,
        // afin que ses dimensions n'interfèrent pas avec la disposition des boutons.
        className="invisible absolute left-0 top-1 h-full w-full"
        type="color"
        list="presetColors"
        onInput={setColor}
        value={currentTextColor}
        id="input-color"
      />
      <datalist id="presetColors">
        {predefinedColors.map((color) => (
          <option key={color} value={color} />
        ))}
      </datalist>
    </div>
  );
};
