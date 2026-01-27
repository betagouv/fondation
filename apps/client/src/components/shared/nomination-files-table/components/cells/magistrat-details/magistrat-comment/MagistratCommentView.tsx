import type { FC } from 'react';

export type MagistratCommentViewProps = {
  initialComment?: string | null;
};

export const MagistratCommentView: FC<MagistratCommentViewProps> = ({ initialComment }) => {
  return (
    <div>
      <label className="text-xl font-semibold">Commentaire</label>
      <div className="mt-2 whitespace-pre-line rounded border border-gray-300 bg-gray-50 p-4">
        {initialComment || 'Aucun commentaire'}
      </div>
    </div>
  );
};
