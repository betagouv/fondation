BEGIN;

-- CreateEnum
CREATE TYPE "nominations_context"."nomination_file_attachment_type_enum" AS ENUM ('FICHE_DE_JURIDICTION', 'NOTE_INTENTION', 'AUTRE');

-- AlterTable
ALTER TABLE "nominations_context"."nomination_file_attachment"
ADD COLUMN "type" "nominations_context"."nomination_file_attachment_type_enum" NOT NULL DEFAULT 'AUTRE',
ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "nominations_context"."nomination_file_attachment" ALTER COLUMN "type" DROP DEFAULT;

UPDATE "nominations_context"."nomination_file_attachment" AS a
SET created_at = f.created_at
FROM "files_context"."files" AS f
WHERE f.id = a.file_id;

COMMIT;
