BEGIN;

-- CreateEnum
CREATE TYPE "nominations_context"."help_page_enum" AS ENUM ('MEMBRE', 'SECRETARIAT_GENERAL');

-- CreateTable
CREATE TABLE "nominations_context"."help_pages" (
    "content" TEXT NOT NULL,
    "page" "nominations_context"."help_page_enum" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" UUID,

    CONSTRAINT "help_pages_pkey" PRIMARY KEY ("page")
);

-- CreateTable
CREATE TABLE "nominations_context"."help_page_screenshots" (
    "file_id" UUID NOT NULL,
    "page" "nominations_context"."help_page_enum" NOT NULL,

    CONSTRAINT "help_page_screenshots_pkey" PRIMARY KEY ("page","file_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."help_pages" ADD CONSTRAINT "help_pages_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."help_page_screenshots" ADD CONSTRAINT "help_page_screenshots_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files_context"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."help_page_screenshots" ADD CONSTRAINT "help_page_screenshots_page_fkey" FOREIGN KEY ("page") REFERENCES "nominations_context"."help_pages"("page") ON DELETE CASCADE ON UPDATE NO ACTION;

-- One page per space, each existing from the start, empty until an administrator writes it
INSERT INTO "nominations_context"."help_pages" ("content", "page", "updated_at")
VALUES
    ('', 'MEMBRE', CURRENT_TIMESTAMP),
    ('', 'SECRETARIAT_GENERAL', CURRENT_TIMESTAMP);

COMMIT;
