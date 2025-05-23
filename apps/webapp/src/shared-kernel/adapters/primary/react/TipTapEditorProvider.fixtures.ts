import { Editor } from "@tiptap/react";
import {
  createExtensions,
  dataFileNameKey,
} from "../../../../reports/adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import { TipTapEditorProvider } from "./TipTapEditorProvider";

export const setupTestEditor = () => {
  const tiptapEditor = new Editor({ extensions: createExtensions() });
  const editorProvider = new TipTapEditorProvider(tiptapEditor);

  const editorWithImage = () => {
    tiptapEditor.commands.setImage(anImage);
  };

  const expectImagePersisted = () => {
    expect(tiptapEditor.storage.image.files).toEqual({
      [anImage[dataFileNameKey]]: new File([""], "test"),
    });
  };

  return {
    editorProvider,
    tiptapEditor,

    editorWithImage,

    expectImagePersisted,
  };
};

export const anImage = {
  src: "https://fakeimg.pl/10x10/",
  alt: "An example image",
  title: "Example Image",
  [dataFileNameKey]: "image.png",
};
