BEGIN;

-- CreateTable
CREATE TABLE nominations_context.member_memo (
  user_id UUID NOT NULL,
  nomination_file_id UUID NOT NULL,
  memo TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3),

  CONSTRAINT member_memo_pkey PRIMARY KEY (user_id, nomination_file_id)
);

-- AddForeignKey
ALTER TABLE nominations_context.member_memo ADD CONSTRAINT member_memo_user_id_fkey FOREIGN KEY (
  user_id
) REFERENCES identity_and_access_context."users" (id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE nominations_context.member_memo ADD CONSTRAINT member_memo_nomination_file_id_fkey FOREIGN KEY (
  nomination_file_id
) REFERENCES nominations_context.dossier_de_nomination (id) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT;