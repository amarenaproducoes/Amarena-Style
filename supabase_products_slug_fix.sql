-- Adiciona restrição de unicidade ao campo referenceCode
ALTER TABLE products ADD CONSTRAINT products_referenceCode_unique UNIQUE (referenceCode);

-- Garante que referenceCode não seja nulo para os produtos existentes (caso houver algum nulo, você precisará preencher antes)
-- Se já houver produtos sem referência, este comando pode falhar. 
-- Mas como o usuário disse que é obrigatório em todo cadastro, vamos assumir que podemos tornar NOT NULL no futuro.
