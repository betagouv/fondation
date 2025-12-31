-- AlterTable
ALTER TABLE "nominations_context"."dossier_de_nomination" ALTER COLUMN "content" SET DEFAULT '{}'::JSONB;

-- CreateTable
CREATE TABLE "nominations_context"."magistrat" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "external_id" TEXT NOT NULL,
    "civilite" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "married_name" TEXT,
    "used_name" TEXT NOT NULL,
    "marital_status" TEXT,
    "professional_email" TEXT,
    "birth_date" DATE,
    "birth_place" TEXT,
    "birth_department" TEXT,
    "grade" TEXT,
    "grade_date" DATE,
    "current_position_id" TEXT,
    "installation_date" DATE,
    "nomination_date" DATE,
    "advancement_year" INTEGER,
    "career_history" TEXT,
    "admin_position" TEXT,
    "admin_position_prev" TEXT,
    "admin_position_prev_start" DATE,
    "admin_position_prev_end" DATE,
    "admin_position_prev2" TEXT,
    "admin_position_prev2_date" DATE,
    "lolfi_updated_at" DATE,

    CONSTRAINT "magistrat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "magistrat_external_id_key" ON "nominations_context"."magistrat"("external_id");

-- CreateIndex
CREATE INDEX "magistrat_last_name_first_name_idx" ON "nominations_context"."magistrat"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "magistrat_used_name_idx" ON "nominations_context"."magistrat"("used_name");

-- CreateIndex
CREATE INDEX "magistrat_professional_email_idx" ON "nominations_context"."magistrat"("professional_email");
