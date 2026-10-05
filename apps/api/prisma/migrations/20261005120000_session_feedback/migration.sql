BEGIN;

CREATE TYPE "nominations_context"."manual_work_share_enum" AS ENUM ('LESS_THAN_10', 'FROM_10_TO_25', 'FROM_25_TO_40', 'FROM_40_TO_60', 'MORE_THAN_60');
CREATE TYPE "nominations_context"."debate_contribution_enum" AS ENUM ('NEVER', 'AT_LEAST_ONCE');
CREATE TYPE "nominations_context"."review_thoroughness_enum" AS ENUM ('YES', 'PARTIALLY', 'NO_LACK_OF_TIME', 'NO_LACK_OF_INFORMATION');
CREATE TYPE "nominations_context"."other_tool_usage_enum" AS ENUM ('NONE', 'OCCASIONALLY', 'SIGNIFICANTLY');

CREATE TABLE "nominations_context"."session_feedback_participation" (
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "session_feedback_participation_pkey" PRIMARY KEY ("session_id", "user_id"),
    CONSTRAINT "session_feedback_participation_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "session_feedback_participation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- anonymous in the application: no author and only the day, an exact time would tell who answered; the shared transaction id (xmin) still links it to its participation in the database
CREATE TABLE "nominations_context"."session_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "ease_rating" SMALLINT NOT NULL,
    "satisfaction_rating" SMALLINT NOT NULL,
    "hindrance" TEXT,
    "answered_on" DATE NOT NULL,

    CONSTRAINT "session_feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_feedback_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE "nominations_context"."member_session_feedback" (
    "feedback_id" UUID NOT NULL,
    "manual_work_share" "nominations_context"."manual_work_share_enum" NOT NULL,
    "debate_contribution" "nominations_context"."debate_contribution_enum" NOT NULL,
    "review_thoroughness" "nominations_context"."review_thoroughness_enum" NOT NULL,

    CONSTRAINT "member_session_feedback_pkey" PRIMARY KEY ("feedback_id"),
    CONSTRAINT "member_session_feedback_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "nominations_context"."session_feedback" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE "nominations_context"."secretariat_session_feedback" (
    "feedback_id" UUID NOT NULL,
    "manual_work_share" "nominations_context"."manual_work_share_enum" NOT NULL,
    "other_tool_usage" "nominations_context"."other_tool_usage_enum" NOT NULL,
    "other_tool_purpose" TEXT,

    CONSTRAINT "secretariat_session_feedback_pkey" PRIMARY KEY ("feedback_id"),
    CONSTRAINT "secretariat_session_feedback_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "nominations_context"."session_feedback" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

COMMIT;
