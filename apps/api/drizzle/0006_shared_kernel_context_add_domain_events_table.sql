BEGIN;

CREATE SCHEMA "shared_kernel_context";

CREATE TYPE "shared_kernel_context"."domain_event_status" AS ENUM('NEW', 'PENDING', 'CONSUMED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shared_kernel_context"."domain_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurredOn" timestamp NOT NULL,
	"status" "shared_kernel_context"."domain_event_status" NOT NULL
);

COMMIT;