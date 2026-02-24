import { colors } from '@codegouvfr/react-dsfr/fr/colors';
import { useCurrentEditor, useEditorState } from '@tiptap/react';
import React, { useRef } from 'react';
import { EditorButton } from './EditorButton';

export const TextColorButton = () => {
  const { editor } = useCurrentEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const textColors = colors.getHex({ isDark: false }).decisions.text;
  const editorTextColor = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.getAttributes('textStyle').color
  });
  const isDisabled = useEditorState({
    editor,
    selector: ({ editor }) => !editor || !editor.can().setColor('#000000')
  });

  const [textColor, setTextColor] = React.useState(editorTextColor ?? textColors.default.grey.default);

  const predefinedColors = [
    textColors.default.grey.default,
    textColors.default.success.default,
    textColors.default.error.default
  ];

  const setColor: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const nextTextColor = event.target.value;

    setTextColor(nextTextColor);
    editor?.chain().focus().setColor(nextTextColor).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      <EditorButton
        onClick={() => inputRef.current?.click()}
        disabled={!!isDisabled}
        title="Couleur du texte"
        style={{ color: textColor }}
        iconId="ri-font-color"
      />
      <input
        ref={inputRef}
        // L'input est positionné de façon absolue, relativement au div parent,
        // afin que ses dimensions n'interfèrent pas avec la disposition des boutons.
        className="invisible absolute left-0 top-1 h-full w-full"
        type="color"
        list="presetColors"
        onChange={setColor}
        value={textColor}
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
