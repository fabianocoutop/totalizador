-- =====================================================
-- SCRIPT SUPABASE — Totalizador de Horas
-- Execute este script inteiro no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e clique Run
-- =====================================================

-- 1. Profiles (extensão do auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Empresas
CREATE TABLE empresas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Projetos
CREATE TABLE projetos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id BIGINT REFERENCES empresas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Registros de horas
CREATE TABLE registros (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  projeto_id BIGINT REFERENCES projetos(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  ticket TEXT,
  descricao TEXT,
  intervalos JSONB NOT NULL DEFAULT '[]',
  total_minutos INT NOT NULL DEFAULT 0,
  apontado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own empresas" ON empresas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own projetos" ON projetos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own registros" ON registros FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger: criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
