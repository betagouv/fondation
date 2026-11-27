-- CreateTable
CREATE TABLE "identity_and_access_context"."unrecognised_magistrat_email" (
    "email" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "last_attempt_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unrecognised_magistrat_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_and_access_context"."attached_magistrat_email" (
    "attached_at" TIMESTAMP(3) NOT NULL,
    "author_id" UUID,
    "email" TEXT NOT NULL,
    "id" UUID NOT NULL,
    "magistrat_id" UUID NOT NULL,

    CONSTRAINT "attached_magistrat_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unrecognised_magistrat_email_email_key" ON "identity_and_access_context"."unrecognised_magistrat_email"("email");

-- CreateIndex
CREATE UNIQUE INDEX "attached_magistrat_email_email_key" ON "identity_and_access_context"."attached_magistrat_email"("email");

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."attached_magistrat_email" ADD CONSTRAINT "attached_magistrat_email_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."attached_magistrat_email" ADD CONSTRAINT "attached_magistrat_email_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "data_administration_context"."magistrat"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

