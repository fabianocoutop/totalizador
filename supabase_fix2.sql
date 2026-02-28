-- =====================================================
-- FIX 2: Desabilitar confirmação de email
-- Rode no SQL Editor do Supabase
-- =====================================================

-- Permitir login sem confirmação de email
-- (Isso é feito via Dashboard > Authentication > Providers > Email > Disable "Confirm email")
-- Mas podemos confirmar os usuários existentes que estão pendentes:
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- Verificar se o perfil foi criado corretamente
-- Se não existir, criar manualmente para o usuário existente
INSERT INTO profiles (id, nome)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'nome', u.email)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
