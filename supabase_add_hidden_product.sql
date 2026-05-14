-- Script para adicionar coluna de produto oculto na tabela de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
