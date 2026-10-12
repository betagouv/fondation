BEGIN;

-- AlterTable
ALTER TABLE "docs"."official_report_nomination_file"
    ADD COLUMN "html_edited" TEXT,
    ADD COLUMN "html_outdated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "docs"."official_report"
    ADD COLUMN "outdated" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "intro_html" TEXT,
    ADD COLUMN "intro_outdated" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "conclusion_html" TEXT,
    ADD COLUMN "conclusion_outdated" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "docs"."official_report_section_title" (
    "official_report_id" UUID NOT NULL,
    "outcome" "docs"."agenda_file_outcome_enum" NOT NULL,
    "title" TEXT,

    CONSTRAINT "official_report_section_title_pkey" PRIMARY KEY ("official_report_id", "outcome")
);

-- AddForeignKey
ALTER TABLE "docs"."official_report_section_title"
    ADD CONSTRAINT "official_report_section_title_official_report_id_fkey"
    FOREIGN KEY ("official_report_id") REFERENCES "docs"."official_report"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable
CREATE TABLE "docs"."official_report_section_intro" (
    "official_report_id" UUID NOT NULL,
    "outcome" "docs"."agenda_file_outcome_enum" NOT NULL,
    "html" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_report_section_intro_pkey" PRIMARY KEY ("official_report_id", "outcome")
);

-- AddForeignKey
ALTER TABLE "docs"."official_report_section_intro"
    ADD CONSTRAINT "official_report_section_intro_official_report_id_fkey"
    FOREIGN KEY ("official_report_id") REFERENCES "docs"."official_report"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT;