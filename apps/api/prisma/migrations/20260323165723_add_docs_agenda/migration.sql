-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "docs";

-- CreateTable
CREATE TABLE "docs"."agenda" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,

    CONSTRAINT "agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docs"."agenda_nomination_file" (
    "agenda_id" UUID NOT NULL,
    "nomination_file_id" UUID NOT NULL,

    CONSTRAINT "agenda_nomination_file_pkey" PRIMARY KEY ("agenda_id","nomination_file_id")
);

-- AddForeignKey
ALTER TABLE "docs"."agenda" ADD CONSTRAINT "agenda_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda_nomination_file" ADD CONSTRAINT "agenda_nomination_file_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "docs"."agenda"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docs"."agenda_nomination_file" ADD CONSTRAINT "agenda_nomination_file_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
