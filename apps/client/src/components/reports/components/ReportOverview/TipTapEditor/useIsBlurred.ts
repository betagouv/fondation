import { useCurrentEditor } from '@tiptap/react';
import { useEffect, useState } from 'react';

export const useIsBlurred = () => {
  const { editor } = useCurrentEditor();
  const [isBlurred, setIsBlurred] = useState(true);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleBlur = (event: FocusEvent) => {
      if (event.relatedTarget) return;
      setIsBlurred(true);
    };
    const handleFocus = () => {
      setIsBlurred(false);
    };

    editor.on('blur', ({ event }) => handleBlur(event));
    editor.on('focus', handleFocus);

    return () => {
      editor.off('blur', ({ event }) => handleBlur(event));
      editor.off('focus', handleFocus);
    };
  }, [editor]);

  return isBlurred;
};
