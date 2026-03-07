-- =====================================================
-- FIX 3: Avatar + Indicador de registro em planejamento
-- Execute no SQL Editor do Supabase
-- =====================================================

-- 1. Adicionar coluna avatar_url na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Adicionar coluna registro_criado na tabela planejamentos
ALTER TABLE planejamentos ADD COLUMN IF NOT EXISTS registro_criado BOOLEAN DEFAULT false;

-- =====================================================
-- 3. STORAGE: Criar bucket 'avatars' MANUALMENTE no Dashboard
--    Storage → New Bucket → Nome: avatars → Marcar como PUBLIC
-- =====================================================

-- 4. Policies para o bucket avatars
--    (executar APÓS criar o bucket no Dashboard)

-- Permissão de upload (INSERT) para usuários autenticados
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permissão de leitura pública
CREATE POLICY "Public avatar read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permissão de update para o próprio usuário
CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permissão de delete para o próprio usuário
CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- 5. EMAIL TEMPLATE: Reset Password
--    Authentication → Email Templates → Reset Password
--    Substituir o template padrão pelo HTML abaixo:
-- =====================================================
-- 
-- <h2>Redefinir senha - Ticket Metrics</h2>
-- <p>Olá! Clique no botão abaixo para redefinir sua senha:</p>
-- <p>
--   <a href="https://ittjnozvqldykjealtxb.supabase.co/auth/v1/verify?token={{ .TokenHash }}&type=recovery&redirect_to=https://fabianocoutop.github.io/totalizador/"
--      style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
--     🔑 Redefinir minha senha
--   </a>
-- </p>
-- <p style="color: #888; font-size: 12px;">Se você não solicitou a redefinição, ignore este email.</p>
