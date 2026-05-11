-- ==========================================================
-- SQL PARA ATUALIZAÇÃO DO SISTEMA DE ESTOQUE
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================================

-- 1. Adicionar colunas de estoque na tabela de produtos
-- 'current_stock' rastreia o saldo atual
-- 'initial_stock' apenas para registro histórico do início
-- 'unit_cost' para controle financeiro (opcional)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS initial_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2);

-- 2. Criar tabela de movimentações de estoque (Histórico)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('in', 'out', 'adjustment')), -- in: entrada, out: saída, adjustment: ajuste manual
  reason TEXT, -- Motivo (ex: "Venda", "Ajuste manual", "Nova remessa")
  quantity INTEGER, -- Quantidade movimentada (pode ser negativa em ajustes)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS (Row Level Security) para a nova tabela
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso simples (semelhante às tabelas existentes)
-- Nota: Em produção, estas devem ser restritas conforme o nível de segurança desejado
CREATE POLICY "Enable access for all users" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);

-- 5. Inicializar saldo atual de produtos existentes
-- Garante que o balance atual seja igual ao inicial para produtos já cadastrados
UPDATE products SET current_stock = COALESCE(initial_stock, 0) WHERE current_stock IS NULL;

-- 6. Adicionar configuração de ativação/desativação do sistema no Painel
INSERT INTO settings (id, value) 
VALUES ('is_stock_system_enabled', 'true')
ON CONFLICT (id) DO NOTHING;
