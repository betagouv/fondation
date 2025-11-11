BEGIN;

-- CreateEnum
CREATE TYPE "reports_context"."report_file_usage_enum" AS ENUM ('ATTACHMENT', 'EMBEDDED_SCREENSHOT');

-- CreateTable
CREATE TABLE "reports_context"."report_files" (
    "fileId" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "usage" "reports_context"."report_file_usage_enum" NOT NULL,

    CONSTRAINT "report_files_pkey" PRIMARY KEY ("fileId","reportId")
);

-- AddForeignKey
ALTER TABLE "reports_context"."report_files" ADD CONSTRAINT "report_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports_context"."report_files" ADD CONSTRAINT "report_files_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports_context"."reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT;
