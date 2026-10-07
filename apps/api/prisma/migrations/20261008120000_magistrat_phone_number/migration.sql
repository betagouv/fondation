BEGIN;

-- the numbers the secretariat saves itself, beside the one LOLFI copies on each candidacy
CREATE TABLE "nominations_context"."magistrat_phone_number" (
    "id" UUID NOT NULL,
    "magistrat_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "label" TEXT,
    "author_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magistrat_phone_number_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "magistrat_phone_number_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "magistrat_phone_number_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "magistrat_phone_number_magistrat_id_number_key" ON "nominations_context"."magistrat_phone_number" ("magistrat_id", "number");

COMMIT;
