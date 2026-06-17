export function MagistratCommentView(props: { id: string; initialComment?: string | null }) {
  const { id, initialComment } = props;
  return (
    <div
      id={id}
      className="fr-mt-2v fr-p-4v rounded-sm border border-gray-300 bg-gray-50 whitespace-pre-line"
    >
      {initialComment || 'Aucun commentaire'}
    </div>
  );
}
