export function MagistratCommentView(props: { id: string; initialComment?: string | null }) {
  const { id, initialComment } = props;
  return (
    <div
      id={id}
      className="fr-mt-2v fr-p-4v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey) whitespace-pre-line"
    >
      {initialComment || 'Aucun commentaire'}
    </div>
  );
}
