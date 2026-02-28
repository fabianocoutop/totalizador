-- =====================================================
-- FIX: Corrigir trigger de criação de perfil
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Remover trigger e função antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recriar função com SET search_path para evitar problemas de segurança
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Garantir que a policy permite INSERT pelo trigger (SECURITY DEFINER bypassa RLS,
-- mas vamos adicionar policy específica por segurança)
DROP POLICY IF EXISTS "Users see own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service can insert profiles" ON profiles FOR INSERT WITH CHECK (true);
