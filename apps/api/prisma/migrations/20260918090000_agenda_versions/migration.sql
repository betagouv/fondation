BEGIN;

-- CreateEnum
CREATE TYPE "docs"."doc_version_status_enum" AS ENUM ('DRAFT', 'VALIDATED');

-- CreateTable
CREATE TABLE "docs"."agenda_version" (
    "id" UUID NOT NULL,
    "agenda_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "docs"."doc_version_status_enum" NOT NULL DEFAULT 'DRAFT',
    "date" DATE NOT NULL,
    "session_meeting_date" DATE NOT NULL,
    "chairman_id" UUID,
    "chairman_first_name" TEXT NOT NULL,
    "chairman_last_name" TEXT NOT NULL,
    "chairman_title" "nominations_context"."user_title_enum",
    "chairman_display_title" TEXT,
    "chairman_gender" "identity_and_access_context"."gender" NOT NULL,
    "html" TEXT,
    "html_outdated" BOOLEAN NOT NULL DEFAULT false,
    "is_manually_edited" BOOLEAN NOT NULL DEFAULT false,
    "pdf_file_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "validated_at" TIMESTAMP(3),
    "validated_by" UUID,

    CONSTRAINT "agenda_version_pkey" PRIMARY KEY ("id")
);

-- every existing agenda becomes its own first version.
-- a stored PDF used to stand for a validation, as it already did for the official report,
-- so those agendas keep a validated version and the others start as a draft.
-- the agenda holds no update timestamp, so the creation date is the closest validation date available.
INSERT INTO "docs"."agenda_version" (
    "id",
    "agenda_id",
    "version",
    "status",
    "date",
    "session_meeting_date",
    "chairman_id",
    "chairman_first_name",
    "chairman_last_name",
    "chairman_title",
    "chairman_display_title",
    "chairman_gender",
    "html",
    "html_outdated",
    "is_manually_edited",
    "pdf_file_id",
    "created_at",
    "created_by",
    "validated_at"
)
SELECT
    gen_random_uuid(),
    "id",
    1,
    CASE WHEN "pdf_file_id" IS NOT NULL THEN 'VALIDATED' ELSE 'DRAFT' END::"docs"."doc_version_status_enum",
    "date",
    "session_meeting_date",
    "chairman_id",
    "chairman_first_name",
    "chairman_last_name",
    "chairman_title",
    "chairman_display_title",
    "chairman_gender",
    "html",
    "html_outdated",
    "is_manually_edited",
    "pdf_file_id",
    "created_at",
    "created_by",
    CASE WHEN "pdf_file_id" IS NOT NULL THEN "created_at" END
FROM "docs"."agenda";

-- CreateIndex
CREATE UNIQUE INDEX "agenda_version_agenda_id_version_key" ON "docs"."agenda_version" ("agenda_id", "version");

-- AddForeignKey
ALTER TABLE "docs"."agenda_version"
    ADD CONSTRAINT "agenda_version_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "docs"."agenda" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    ADD CONSTRAINT "agenda_version_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    ADD CONSTRAINT "agenda_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    ADD CONSTRAINT "agenda_version_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    ADD CONSTRAINT "agenda_version_pdf_file_id_fkey" FOREIGN KEY ("pdf_file_id") REFERENCES "files_context"."files" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AlterTable: the propositions now belong to a version, not to the agenda itself
ALTER TABLE "docs"."agenda_nomination_file" ADD COLUMN "version_id" UUID;

UPDATE "docs"."agenda_nomination_file" AS "file"
SET "version_id" = "version"."id"
FROM "docs"."agenda_version" AS "version"
WHERE "version"."agenda_id" = "file"."agenda_id";

ALTER TABLE "docs"."agenda_nomination_file"
    ALTER COLUMN "version_id" SET NOT NULL,
    DROP COLUMN "agenda_id";

-- AddForeignKey
ALTER TABLE "docs"."agenda_nomination_file"
    ADD CONSTRAINT "agenda_nomination_file_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "docs"."agenda_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AlterTable: the edition date belongs to the block that was rewritten, not to the whole document
ALTER TABLE "docs"."agenda_nomination_file" ADD COLUMN "html_edited_at" TIMESTAMP(3);

-- the blocks edited before this column existed keep the row timestamp, the closest truth available
UPDATE "docs"."agenda_nomination_file"
SET "html_edited_at" = "updated_at"
WHERE "html_edited" IS NOT NULL;

-- AlterTable: the agenda keeps its identity and its links to the other documents, the version holds the content
ALTER TABLE "docs"."agenda"
    DROP COLUMN "date",
    DROP COLUMN "session_meeting_date",
    DROP COLUMN "chairman_id",
    DROP COLUMN "chairman_first_name",
    DROP COLUMN "chairman_last_name",
    DROP COLUMN "chairman_title",
    DROP COLUMN "chairman_display_title",
    DROP COLUMN "chairman_gender",
    DROP COLUMN "html",
    DROP COLUMN "html_outdated",
    DROP COLUMN "is_manually_edited",
    DROP COLUMN "pdf_file_id";

COMMIT;
