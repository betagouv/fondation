export function MagistratCommentView(props: { id: string; initialComment?: string | null }) {
  const { id, initialComment } = props;
  return (
    <div id={id} className="mt-2 rounded-sm border border-gray-300 bg-gray-50 p-4 whitespace-pre-line">
      {initialComment || 'Aucun commentaire'}
    </div>
  );
}
