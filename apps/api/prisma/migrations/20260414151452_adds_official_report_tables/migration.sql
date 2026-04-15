BEGIN;

-- AlterTable
ALTER TABLE "docs"."agenda" ADD COLUMN     "official_report_id" UUID;

-- CreateTable
CREATE TABLE "docs"."official_report" (
    "id" UUID NOT NULL,
    "session_meeting_date" DATE NOT NULL,
    "session_meeting_starting_time" TIME NOT NULL,
    "has_renunciation" BOOLEAN NOT NULL,
    "html" TEXT,
    "pdf_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "justice_department_contact_id" BIGINT,
    "justice_department_contact_name" TEXT NOT NULL,
    "chairman_id" UUID,
    "chairman_first_name" TEXT NOT NULL,
    "chairman_last_name" TEXT NOT NULL,
    "chairman_title" TEXT,
    "chairman_gender" "identity_and_access_context"."gender" NOT NULL,
    "secretary_id" UUID,
    "secretary_first_name" TEXT NOT NULL,
    "secretary_last_name" TEXT NOT NULL,
    "secretary_title" TEXT,
    "secretary_gender" "identity_and_access_context"."gender" NOT NULL,

    CONSTRAINT "official_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."official_report_member" (
    "id" BIGSERIAL NOT NULL,
    "official_report_id" UUID NOT NULL,
    "member_id" UUID,
    "gender" "identity_and_access_context"."gender" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "official_report_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."justice_department_contact" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" UUID,

    CONSTRAINT "justice_department_contact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_official_report_id_fkey" FOREIGN KEY ("official_report_id") REFERENCES "docs"."official_report"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_secretary_id_fkey" FOREIGN KEY ("secretary_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_justice_department_contact_id_fkey" FOREIGN KEY ("justice_department_contact_id") REFERENCES "docs"."justice_department_contact"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report" ADD CONSTRAINT "official_report_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "files_context"."files"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."official_report_member" ADD CONSTRAINT "official_report_member_official_report_id_fkey" FOREIGN KEY ("official_report_id") REFERENCES "docs"."official_report"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."justice_department_contact" ADD CONSTRAINT "justice_department_contact_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;