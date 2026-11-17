-- CreateEnum
CREATE TYPE "nominations_context"."position_vacancy_reason_enum" AS ENUM ('DEATH', 'DISCHARGE', 'DISCIPLINARY_DISMISSAL', 'OTHER', 'RETIREMENT', 'STRIKING_OFF');

-- CreateTable
CREATE TABLE "nominations_context"."position_vacancy" (
    "author_id" UUID,
    "magistrat_id" UUID NOT NULL,
    "position_id" INTEGER NOT NULL,
    "reason" "nominations_context"."position_vacancy_reason_enum" NOT NULL,
    "reason_detail" TEXT,
    "start_date" DATE NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_vacancy_pkey" PRIMARY KEY ("magistrat_id","position_id")
);

-- CreateTable
CREATE TABLE "nominations_context"."position_vacancy_attachment" (
    "file_id" UUID NOT NULL,
    "magistrat_id" UUID NOT NULL,
    "position_id" INTEGER NOT NULL,

    CONSTRAINT "position_vacancy_attachment_pkey" PRIMARY KEY ("magistrat_id","position_id","file_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."position_vacancy" ADD CONSTRAINT "position_vacancy_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."position_vacancy" ADD CONSTRAINT "position_vacancy_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "data_administration_context"."magistrat"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."position_vacancy" ADD CONSTRAINT "position_vacancy_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "data_administration_context"."position"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."position_vacancy_attachment" ADD CONSTRAINT "position_vacancy_attachment_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."position_vacancy_attachment" ADD CONSTRAINT "position_vacancy_attachment_magistrat_id_position_id_fkey" FOREIGN KEY ("magistrat_id", "position_id") REFERENCES "nominations_context"."position_vacancy"("magistrat_id", "position_id") ON DELETE CASCADE ON UPDATE NO ACTION;

