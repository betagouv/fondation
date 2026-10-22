-- Every access decision taken on the role assumes it, while an admin passes every role guard
ALTER TABLE "identity_and_access_context"."users" ADD CONSTRAINT "users_admin_within_secretariat" CHECK (NOT "is_admin" OR "role" = 'ADJOINT_SECRETAIRE_GENERAL');
