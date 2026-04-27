-- Executar este script no SQL Editor do Supabase para atualizar a tabela 'products' e políticas de segurança (RLS)

-- 1. Cria a tabela products se não existir, ou atualiza se já existir
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Adiciona as colunas recém-criadas na aplicação caso não existam
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "images" TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "installments" INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "paymentType" TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "options" TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "colors" TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "sizes" TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "isNew" BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- 3. Habilita RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. Cria políticas de segurança para a tabela 'products'
-- Permitir leitura pública (para que os visitantes vejam os produtos na loja)
CREATE POLICY IF NOT EXISTS "Permitir leitura pública"
ON public.products FOR SELECT
USING (true);

-- Permitir alterações. Se a sua aplicação não usa autenticação do Supabase no Admin (você acessa direto),
-- você deve permitir todas as operações ou configurar pelo anon (cuidado com segurança).
-- Se a autenticação estiver implementada com anon key (ambiente de testes/preview):
CREATE POLICY IF NOT EXISTS "Permitir alterações anônimas"
ON public.products FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Configurar RLS e tabela para settings (logo, banners, etc)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir leitura pública settings"
ON public.settings FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Permitir alterações anônimas settings"
ON public.settings FOR ALL USING (true) WITH CHECK (true);
