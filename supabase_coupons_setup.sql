-- Tabela de Cupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_value NUMERIC, -- Valor fixo em reais
  discount_percent NUMERIC, -- Porcentagem (ex: 10 para 10%)
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  qtde_disponivel INTEGER NOT NULL,
  qtde_utilizada INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Utilização
CREATE TABLE IF NOT EXISTS coupon_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_code TEXT NOT NULL,
  discount_value NUMERIC,
  discount_percent NUMERIC,
  expiration_date TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (opcional, dependendo se você usa autenticação)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_history ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas para o demo (leitura, escrita, atualização e exclusão pública)
DROP POLICY IF EXISTS "Permitir leitura pública de cupons" ON coupons;
DROP POLICY IF EXISTS "Permitir inserção de histórico" ON coupon_history;
DROP POLICY IF EXISTS "Permitir atualização de cupons" ON coupons;

CREATE POLICY "Permitir tudo em cupons" ON coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo em histórico" ON coupon_history FOR ALL USING (true) WITH CHECK (true);
