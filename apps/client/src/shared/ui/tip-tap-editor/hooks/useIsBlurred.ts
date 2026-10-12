import { useCurrentEditor } from '@tiptap/react';
import { useEffect, useState } from 'react';

export const useIsBlurred = () => {
  const { editor } = useCurrentEditor();
  const [isBlurred, setIsBlurred] = useState(true);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleBlur = ({ event }: { event: FocusEvent }) => {
      if (event.relatedTarget) return;
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setIsBlurred(false);
    };

    editor.on('blur', handleBlur);
    editor.on('focus', handleFocus);

    return () => {
      editor.off('blur', handleBlur);
      editor.off('focus', handleFocus);
    };
  }, [editor]);

  return isBlurred;
};
