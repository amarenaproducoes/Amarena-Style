-- Script para adicionar coluna de contador de acessos na tabela de cupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;
