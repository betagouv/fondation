-- CreateEnum
CREATE TYPE nominations_context.observation_follow_up_enum AS ENUM ('REFERENCE', 'ALERT', 'INTERESTING');

-- AlterTable
ALTER TABLE nominations_context.observation
ADD COLUMN follow_up nominations_context.observation_follow_up_enum,
ADD COLUMN follow_up_comment TEXT,
ADD COLUMN followed_up_at TIMESTAMP(3),
ADD COLUMN followed_up_by_user_id UUID;

-- AddForeignKey
ALTER TABLE nominations_context.observation ADD CONSTRAINT observation_followed_up_by_user_id_fkey FOREIGN KEY (
  followed_up_by_user_id
) REFERENCES identity_and_access_context."users" (id) ON DELETE SET NULL ON UPDATE NO ACTION;
