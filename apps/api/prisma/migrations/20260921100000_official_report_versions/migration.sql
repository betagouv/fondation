BEGIN;

-- CreateTable
CREATE TABLE "docs"."official_report_version" (
    "id" UUID NOT NULL,
    "official_report_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "docs"."doc_version_status_enum" NOT NULL DEFAULT 'DRAFT',
    "session_meeting_date" DATE NOT NULL,
    "session_meeting_starting_time" TIME NOT NULL,
    "session_meeting_ending_time" TIME NOT NULL,
    "has_renunciation" BOOLEAN NOT NULL,
    "justice_department_contact_id" BIGINT,
    "justice_department_contact_name" TEXT NOT NULL,
    "chairman_id" UUID,
    "chairman_first_name" TEXT NOT NULL,
    "chairman_last_name" TEXT NOT NULL,
    "chairman_title" "nominations_context"."user_title_enum",
    "chairman_display_title" TEXT,
    "chairman_gender" "identity_and_access_context"."gender" NOT NULL,
    "secretary_id" UUID,
    "secretary_first_name" TEXT NOT NULL,
    "secretary_last_name" TEXT NOT NULL,
    "secretary_title" "nominations_context"."user_title_enum",
    "secretary_display_title" TEXT,
    "secretary_gender" "identity_and_access_context"."gender" NOT NULL,
    "intro_html" TEXT,
    "intro_outdated" BOOLEAN NOT NULL DEFAULT false,
    "conclusion_html" TEXT,
    "conclusion_outdated" BOOLEAN NOT NULL DEFAULT false,
    "html" TEXT,
    "outdated" BOOLEAN NOT NULL DEFAULT false,
    "is_manually_edited" BOOLEAN NOT NULL DEFAULT false,
    "pdf_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "validated_at" TIMESTAMP(3),
    "validated_by" UUID,

    CONSTRAINT "official_report_version_pkey" PRIMARY KEY ("id")
);

-- every existing report becomes its own first version.
-- it already carried a validation date, so it is kept as is rather than guessed from the stored PDF,
-- unlike the agenda which had no such column before its own versions.
INSERT INTO "docs"."official_report_version" (
    "id",
    "official_report_id",
    "version",
    "status",
    "session_meeting_date",
    "session_meeting_starting_time",
    "session_meeting_ending_time",
    "has_renunciation",
    "justice_department_contact_id",
    "justice_department_contact_name",
    "chairman_id",
    "chairman_first_name",
    "chairman_last_name",
    "chairman_title",
    "chairman_display_title",
    "chairman_gender",
    "secretary_id",
    "secretary_first_name",
    "secretary_last_name",
    "secretary_title",
    "secretary_display_title",
    "secretary_gender",
    "intro_html",
    "intro_outdated",
    "conclusion_html",
    "conclusion_outdated",
    "html",
    "outdated",
    "is_manually_edited",
    "pdf_id",
    "created_at",
    "created_by",
    "validated_at"
)
SELECT
    gen_random_uuid(),
    "id",
    1,
    CASE WHEN "validated_at" IS NOT NULL THEN 'VALIDATED' ELSE 'DRAFT' END::"docs"."doc_version_status_enum",
    "session_meeting_date",
    "session_meeting_starting_time",
    "session_meeting_ending_time",
    "has_renunciation",
    "justice_department_contact_id",
    "justice_department_contact_name",
    "chairman_id",
    "chairman_first_name",
    "chairman_last_name",
    "chairman_title",
    "chairman_display_title",
    "chairman_gender",
    "secretary_id",
    "secretary_first_name",
    "secretary_last_name",
    "secretary_title",
    "secretary_display_title",
    "secretary_gender",
    "intro_html",
    "intro_outdated",
    "conclusion_html",
    "conclusion_outdated",
    "html",
    "outdated",
    "is_manually_edited",
    "pdf_id",
    "created_at",
    "author_id",
    "validated_at"
FROM "docs"."official_report";

-- CreateIndex
CREATE UNIQUE INDEX "official_report_version_official_report_id_version_key" ON "docs"."official_report_version" ("official_report_id", "version");

-- AddForeignKey
ALTER TABLE "docs"."official_report_version"
    ADD CONSTRAINT "official_report_version_official_report_id_fkey" FOREIGN KEY ("official_report_id") REFERENCES "docs"."official_report" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    ADD CONSTRAINT "official_report_version_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    ADD CONSTRAINT "official_report_version_secretary_id_fkey" FOREIGN KEY ("secretary_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    ADD CONSTRAINT "official_report_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    ADD CONSTRAINT "official_report_version_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    ADD CONSTRAINT "official_report_version_justice_department_contact_id_fkey" FOREIGN KEY ("justice_department_contact_id") REFERENCES "docs"."justice_department_contact" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    ADD CONSTRAINT "official_report_version_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "files_context"."files" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AlterTable: the four children now belong to a version, not to the report itself
ALTER TABLE "docs"."official_report_member" ADD COLUMN "version_id" UUID;
ALTER TABLE "docs"."official_report_nomination_file" ADD COLUMN "version_id" UUID;
ALTER TABLE "docs"."official_report_section_title" ADD COLUMN "version_id" UUID;
ALTER TABLE "docs"."official_report_section_intro" ADD COLUMN "version_id" UUID;

UPDATE "docs"."official_report_member" AS "child"
SET "version_id" = "version"."id"
FROM "docs"."official_report_version" AS "version"
WHERE "version"."official_report_id" = "child"."official_report_id";

UPDATE "docs"."official_report_nomination_file" AS "child"
SET "version_id" = "version"."id"
FROM "docs"."official_report_version" AS "version"
WHERE "version"."official_report_id" = "child"."official_report_id";

UPDATE "docs"."official_report_section_title" AS "child"
SET "version_id" = "version"."id"
FROM "docs"."official_report_version" AS "version"
WHERE "version"."official_report_id" = "child"."official_report_id";

UPDATE "docs"."official_report_section_intro" AS "child"
SET "version_id" = "version"."id"
FROM "docs"."official_report_version" AS "version"
WHERE "version"."official_report_id" = "child"."official_report_id";

ALTER TABLE "docs"."official_report_member"
    ALTER COLUMN "version_id" SET NOT NULL,
    DROP COLUMN "official_report_id",
    ADD CONSTRAINT "official_report_member_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "docs"."official_report_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- a block also says when it was written by hand, and whether the agenda wrote it
ALTER TABLE "docs"."official_report_nomination_file"
    ALTER COLUMN "version_id" SET NOT NULL,
    DROP COLUMN "official_report_id",
    ADD COLUMN "html_edited_at" TIMESTAMP(3),
    ADD COLUMN "html_from_agenda" BOOLEAN NOT NULL DEFAULT false,
    ADD CONSTRAINT "official_report_nomination_file_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "docs"."official_report_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- the blocks edited before this column existed keep the row timestamp, the closest truth available,
-- and count as written in the report since nothing was ever carried over from an agenda
UPDATE "docs"."official_report_nomination_file"
SET "html_edited_at" = "updated_at"
WHERE "html_edited" IS NOT NULL;

-- the two section tables key on the outcome, so their primary key follows the version
ALTER TABLE "docs"."official_report_section_title"
    DROP CONSTRAINT "official_report_section_title_pkey",
    ALTER COLUMN "version_id" SET NOT NULL,
    DROP COLUMN "official_report_id",
    ADD CONSTRAINT "official_report_section_title_pkey" PRIMARY KEY ("version_id", "outcome"),
    ADD CONSTRAINT "official_report_section_title_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "docs"."official_report_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "docs"."official_report_section_intro"
    DROP CONSTRAINT "official_report_section_intro_pkey",
    ALTER COLUMN "version_id" SET NOT NULL,
    DROP COLUMN "official_report_id",
    ADD CONSTRAINT "official_report_section_intro_pkey" PRIMARY KEY ("version_id", "outcome"),
    ADD CONSTRAINT "official_report_section_intro_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "docs"."official_report_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AlterTable: the report keeps its identity and its link to the agendas, the version holds the content
ALTER TABLE "docs"."official_report"
    DROP COLUMN "session_meeting_date",
    DROP COLUMN "session_meeting_starting_time",
    DROP COLUMN "session_meeting_ending_time",
    DROP COLUMN "has_renunciation",
    DROP COLUMN "justice_department_contact_id",
    DROP COLUMN "justice_department_contact_name",
    DROP COLUMN "chairman_id",
    DROP COLUMN "chairman_first_name",
    DROP COLUMN "chairman_last_name",
    DROP COLUMN "chairman_title",
    DROP COLUMN "chairman_display_title",
    DROP COLUMN "chairman_gender",
    DROP COLUMN "secretary_id",
    DROP COLUMN "secretary_first_name",
    DROP COLUMN "secretary_last_name",
    DROP COLUMN "secretary_title",
    DROP COLUMN "secretary_display_title",
    DROP COLUMN "secretary_gender",
    DROP COLUMN "intro_html",
    DROP COLUMN "intro_outdated",
    DROP COLUMN "conclusion_html",
    DROP COLUMN "conclusion_outdated",
    DROP COLUMN "html",
    DROP COLUMN "outdated",
    DROP COLUMN "is_manually_edited",
    DROP COLUMN "pdf_id",
    DROP COLUMN "updated_at",
    DROP COLUMN "validated_at";

COMMIT;
