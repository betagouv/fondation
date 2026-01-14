import { Pulse } from '@/components/shared/loaders/pulse';
import { Node, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';
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

  return (
    <NodeViewWrapper>
      <div
        style={{
          position: 'relative',
          backgroundImage: `url(${src})`,
          maxWidth: '400px',
          maxHeight: '400px',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,

          width,
          height
        }}
      >
        <div
          style={{
            inset: '0',
            position: 'absolute',
            background: 'rgb(0, 0, 0, 0.3)',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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
      return { src: null, width: null, height: null, dataFileId: null };
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
          }
      };
    }
  });
