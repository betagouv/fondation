import type { ReactNodeViewProps } from '@tiptap/react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    officialReportModel: {
      resetBlock: (viewProps: ReactNodeViewProps) => ReturnType;
      acknowledgeBlock: (viewProps: ReactNodeViewProps) => ReturnType;
    };
  }
}

export {};
