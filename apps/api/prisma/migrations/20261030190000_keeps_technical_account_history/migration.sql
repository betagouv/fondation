CREATE TABLE "identity_and_access_context"."technical_account_changes" (
    "user_id" UUID NOT NULL,
    "changed_at" TIMESTAMP(6) NOT NULL,
    "is_technical" BOOLEAN NOT NULL,
    "changed_by" UUID,

    CONSTRAINT "technical_account_changes_pkey" PRIMARY KEY ("user_id","changed_at")
);

ALTER TABLE "identity_and_access_context"."technical_account_changes" ADD CONSTRAINT "technical_account_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "identity_and_access_context"."technical_account_changes" ADD CONSTRAINT "technical_account_changes_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- The accounts the previous migration flagged start their history, with no author
INSERT INTO "identity_and_access_context"."technical_account_changes" ("user_id", "changed_at", "is_technical", "changed_by")
SELECT "id", CURRENT_TIMESTAMP, true, NULL
FROM "identity_and_access_context"."users"
WHERE "is_technical";
