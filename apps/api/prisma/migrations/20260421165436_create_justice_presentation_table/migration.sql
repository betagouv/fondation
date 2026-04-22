BEGIN;

ALTER TABLE docs.official_report RENAME COLUMN "chairman_display_title" TO "old_chairman_display_title";
ALTER TABLE docs.official_report ADD COLUMN "chairman_display_title" TEXT;

UPDATE docs.official_report
SET chairman_display_title = users.display_title
FROM identity_and_access_context.users
WHERE chairman_id IS NOT NULL AND users.id = chairman_id;

ALTER TABLE docs.official_report DROP COLUMN old_chairman_display_title;

ALTER TABLE "docs"."agenda" DROP CONSTRAINT "agenda_official_report_id_fkey";

ALTER TABLE "docs"."agenda"
    ADD COLUMN "session_name" TEXT,
    ADD COLUMN "justice_presentation_plan_id" UUID;

UPDATE "docs"."agenda" SET "session_name" = "session"."name"
FROM "nominations_context"."session" WHERE "session"."id" = "session_id";

ALTER TABLE "docs"."agenda" ALTER COLUMN "session_name" SET NOT NULL;

-- CreateTable
CREATE TABLE "docs"."justice_presentation_plan" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME NOT NULL,
    "html" TEXT,
    "pdf_id" UUID,
    "is_presented" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_id" UUID,
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
    "justice_department_contact_id" BIGINT,
    "justice_department_contact_name" TEXT NOT NULL,

    CONSTRAINT "justice_presentation_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."justice_presentation_plan_to_agenda" (
    "plan_id" UUID NOT NULL,
    "agenda_id" UUID NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "justice_presentation_plan_to_agenda_pkey" PRIMARY KEY ("plan_id","agenda_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "justice_presentation_plan_to_agenda_agenda_id_key" ON "docs"."justice_presentation_plan_to_agenda"("agenda_id");

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_official_report_id_fkey" FOREIGN KEY ("official_report_id") REFERENCES "docs"."official_report"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_secretary_id_fkey" FOREIGN KEY ("secretary_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_justice_department_contact_id_fkey" FOREIGN KEY ("justice_department_contact_id") REFERENCES "docs"."justice_department_contact"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan" ADD CONSTRAINT "justice_presentation_plan_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "files_context"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan_to_agenda" ADD CONSTRAINT "justice_presentation_plan_to_agenda_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "docs"."justice_presentation_plan"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- CreateIndex
CREATE UNIQUE INDEX "agenda_justice_presentation_plan_id_id_key" ON "docs"."agenda"("justice_presentation_plan_id", "id");

-- AddForeignKey
ALTER TABLE "docs"."justice_presentation_plan_to_agenda" ADD CONSTRAINT "justice_presentation_plan_to_agenda_plan_id_agenda_id_fkey" FOREIGN KEY ("plan_id", "agenda_id") REFERENCES "docs"."agenda"("justice_presentation_plan_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

COMMIT;