BEGIN;

-- CreateTable: a transparence stuck as it was must be announced once, not every morning
CREATE TABLE "jobs"."lolfi_transparence_anomaly" (
  "lolfi_session_id" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "alerted_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "lolfi_transparence_anomaly_pkey" PRIMARY KEY ("lolfi_session_id")
);

COMMIT;
