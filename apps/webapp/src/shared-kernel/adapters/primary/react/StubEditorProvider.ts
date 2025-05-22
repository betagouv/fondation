import { TextEditorProvider } from "../../../core-logic/providers/textEditor";

export class StubEditorProvider implements TextEditorProvider {
  setImagesSuccess: boolean = true;

  setImages(): boolean {
    return this.setImagesSuccess;
  }

  isEmpty(): boolean {
    return false;
  }
}
