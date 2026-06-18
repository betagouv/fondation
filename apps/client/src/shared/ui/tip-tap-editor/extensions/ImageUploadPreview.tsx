import { Node, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';

import { Pulse } from '@/shared/ui/loaders/pulse';

import { makeEditorImageUploader, type FilesUploader } from './editor-file-uploader';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imagePreview: {
      uploadFiles: (options?: { files?: FileList | readonly File[] | null }) => ReturnType;
    };
  }
}

function ImageUploadNodeView(props: ReactNodeViewProps<HTMLImageElement>) {
  const { src, width, height } = props.node.attrs;

  if (!src) return null;

  return (
    <NodeViewWrapper>
      <div
        style={{
          width: '100%',
          margin: '8px 0',
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            flexGrow: 0,
            flexShrink: 0,
            backgroundImage: `url(${src})`,
            maxWidth: '400px',
            maxHeight: (height / width) * 400 + 'px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            filter: 'blur(1px)',
            width,
            height,
          }}
        />
        <div
          style={{
            inset: '0',
            position: 'absolute',
            background: 'rgb(0, 0, 0, 0.3)',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Pulse />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const ImageUploadPreview = (filesUploader: FilesUploader) =>
  Node.create({
    name: 'imagePreview',

    group: 'block',
    atom: true,
    draggable: false,
    selectable: false,

    addAttributes() {
      return { src: null, width: null, height: null, dataFileName: null };
    },

    renderHTML() {
      return ['img-preview'];
    },

    parseHTML() {
      return [{ tag: 'img-preview', getAttrs: (node) => node.attributes }];
    },

    addNodeView() {
      return ReactNodeViewRenderer(ImageUploadNodeView);
    },

    addCommands() {
      const showFileUploading = makeEditorImageUploader(filesUploader);
      return {
        uploadFiles:
          (options?: { files?: FileList | readonly File[] | null | undefined }) =>
          ({ editor }) => {
            if (options?.files) {
              showFileUploading({ editor, files: [...options.files] });
            }

            return true;
          },
      };
    },
  });
