import { Editor } from '@tiptap/react';
import { useEffect } from 'react';
import { TipTapEditorProvider } from '../components/shared/TipTapEditorProvider';
import { useGetSignedUrl } from '../react-query/queries/get-signed-url.query';

/**
 * Hook pour gérer le refresh automatique des URLs signées dans l'éditeur TipTap
 */
export function useRefreshSignedUrls(editor: Editor | null, screenshotFileIds: string[]) {
  const { data: signedUrlsData } = useGetSignedUrl(screenshotFileIds);

  useEffect(() => {
    if (editor && signedUrlsData && screenshotFileIds.length > 0) {
      const provider = new TipTapEditorProvider(editor);
      provider.replaceImageUrls(signedUrlsData);
    }
  }, [editor, signedUrlsData, screenshotFileIds]);
}
