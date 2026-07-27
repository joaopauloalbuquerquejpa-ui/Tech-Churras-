-- Auditoria de segurança 27/07: admin era single-factor (só senha).
-- 2FA opcional via TOTP — ADMIN pode ativar em /auth/2fa/setup.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
