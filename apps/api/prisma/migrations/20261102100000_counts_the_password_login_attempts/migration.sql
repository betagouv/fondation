CREATE TABLE "identity_and_access_context"."login_attempts" (
    "id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "ip" VARCHAR NOT NULL,
    "attempted_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);
