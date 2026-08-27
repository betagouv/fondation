import type { ReactNodeViewProps } from '@tiptap/react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    docBlockModel: {
      resetBlock: (viewProps: ReactNodeViewProps) => ReturnType;
      acknowledgeBlock: (viewProps: ReactNodeViewProps) => ReturnType;
    };
  }
}

export {};
