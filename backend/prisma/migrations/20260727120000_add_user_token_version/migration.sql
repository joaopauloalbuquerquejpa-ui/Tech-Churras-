-- Auditoria de segurança 27/07: JWT de 30 dias não tinha mecanismo de revogação.
-- tokenVersion permite invalidar todas as sessões de um usuário (troca de senha, ação de admin)
-- sem esperar o token expirar sozinho.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
