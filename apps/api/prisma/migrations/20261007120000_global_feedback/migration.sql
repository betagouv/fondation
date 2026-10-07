BEGIN;

-- the answers per session never reached production, only staging where they were tests: they are dropped, not converted
DROP TABLE "nominations_context"."member_session_feedback";
DROP TABLE "nominations_context"."secretariat_session_feedback";
DROP TABLE "nominations_context"."session_feedback";
DROP TABLE "nominations_context"."session_feedback_participation";

-- pseudonymous: the export numbers the respondents and only shows the day
CREATE TABLE "nominations_context"."feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "ease_rating" SMALLINT NOT NULL,
    "satisfaction_rating" SMALLINT NOT NULL,
    "hindrance" TEXT,
    "answered_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE "nominations_context"."member_feedback" (
    "feedback_id" UUID NOT NULL,
    "manual_work_share" "nominations_context"."manual_work_share_enum" NOT NULL,
    "debate_contribution" "nominations_context"."debate_contribution_enum" NOT NULL,
    "review_thoroughness" "nominations_context"."review_thoroughness_enum" NOT NULL,

    CONSTRAINT "member_feedback_pkey" PRIMARY KEY ("feedback_id"),
    CONSTRAINT "member_feedback_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "nominations_context"."feedback" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE "nominations_context"."secretariat_feedback" (
    "feedback_id" UUID NOT NULL,
    "manual_work_share" "nominations_context"."manual_work_share_enum" NOT NULL,
    "other_tool_usage" "nominations_context"."other_tool_usage_enum" NOT NULL,
    "other_tool_purpose" TEXT,

    CONSTRAINT "secretariat_feedback_pkey" PRIMARY KEY ("feedback_id"),
    CONSTRAINT "secretariat_feedback_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "nominations_context"."feedback" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

COMMIT;
