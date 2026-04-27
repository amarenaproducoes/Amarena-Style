-- Criar tabela de guias de medidas
CREATE TABLE IF NOT EXISTS public.size_guides (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dimensions JSONB NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;

-- Excluir políticas existentes se houver, para evitar conflitos
DROP POLICY IF EXISTS "Permitir leitura pública size_guides" ON public.size_guides;
DROP POLICY IF EXISTS "Permitir alterações anônimas size_guides" ON public.size_guides;

-- Permitir leitura de todos os guias de medidas
CREATE POLICY "Permitir leitura pública size_guides"
ON public.size_guides FOR SELECT USING (true);

-- Permitir alterações para usuários anônimos (ou ajuste de acordo com a sua configuração)
CREATE POLICY "Permitir alterações anônimas size_guides"
ON public.size_guides FOR ALL USING (true) WITH CHECK (true);

-- Inserir dados iniciais para a tabela Masculino e Feminino (conforme imagens fornecidas)
INSERT INTO public.size_guides (id, name, dimensions) VALUES
('male', 'Masculino', '{
  "columns": ["Tamanho", "PP", "P", "M", "G", "GG"],
  "rows": [
    {"label": "Manequim", "values": ["36", "38", "40/42", "44/46", "48"]},
    {"label": "1 - Largura", "values": ["51", "53", "56", "59", "62"]},
    {"label": "2 - Altura", "values": ["69,5", "71,5", "72", "75,5", "77,5"]}
  ]
}'),
('female', 'Feminino', '{
  "columns": ["Tamanho", "PP", "P", "M", "G", "GG"],
  "rows": [
    {"label": "Manequim", "values": ["36", "38", "40/42", "44/46", "48"]},
    {"label": "1 - Largura", "values": ["42", "44,5", "48", "52", "56"]},
    {"label": "2 - Altura", "values": ["59", "59,5", "59,5", "63,5", "66"]}
  ]
}')
ON CONFLICT (id) DO UPDATE SET dimensions = EXCLUDED.dimensions, name = EXCLUDED.name;

-- Atualizar tabela de produtos para incluir o guia de medidas selecionado
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "sizeGuide" TEXT;
