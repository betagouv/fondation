-- 00_squash folded four migrations that never reached production (adds_nomination_file_attachment, openid,
-- adds_file_size, rename_file_size_to_size_in_bytes): production gets them here, the other databases already hold them
BEGIN;

CREATE TABLE IF NOT EXISTS "nominations_context"."nomination_file_attachment" (
    "nomination_file_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "nomination_file_attachment_pkey" PRIMARY KEY ("nomination_file_id","file_id"),
    CONSTRAINT "nomination_file_attachment_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "nomination_file_attachment_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "identity_and_access_context"."openid_request" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "nonce" BYTEA NOT NULL,
    "challenge" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openid_request_pkey" PRIMARY KEY ("provider","id")
);

ALTER TABLE "files_context"."files" ADD COLUMN IF NOT EXISTS "size_in_bytes" INTEGER;

COMMIT;
