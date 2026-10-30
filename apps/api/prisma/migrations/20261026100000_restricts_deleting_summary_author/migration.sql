BEGIN;

-- A summary without author is one not written yet, readable by the general secretariat: deleting its author must not turn a written summary into one
ALTER TABLE "nominations_context"."summaries" DROP CONSTRAINT "summaries_author_id_fkey";
ALTER TABLE "nominations_context"."summaries" ADD CONSTRAINT "summaries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

COMMIT;
