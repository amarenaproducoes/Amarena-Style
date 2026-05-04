# Roadmap: Seção de Consultoria de Moda & Lookbook Interativo

Este documento detalha o planejamento para a Fase 2 do projeto, focada em conteúdo editorial e conversão assistida (Consultoria de Moda).

## 1. Visão Geral
Transformar a experiência de compra em uma jornada de estilo, onde o cliente aprende a combinar peças para ocasiões específicas e pode adquirir o "look completo" com facilidade.

## 2. Funcionalidades Principais (Shoppable Editorial)

### A. Artigos de Estilo (Blog)
- **Tematização:** Artigos focados em ocasiões (Casamentos, Business Casual, Esportes de Luxo, etc).
- **Links Contextuais:** Links no meio do texto que levam diretamente para a página do produto citado.
- **Tipografia:** Estilo editorial clássico para passar autoridade em moda.

### B. Seção "Shop the Look"
- **Mini-Cards:** Galeria no final do artigo com os produtos apresentados.
- **Flag de Seleção ("I want this product"):**
  - Cada item possui um checkbox estilizado.
  - Estado inicial: Todos selecionados (Ativos).
  - Interação: O usuário desmarca o que não deseja.
  - **Regra de Estoque:** 
    - Se o produto estiver inativo/sem estoque: o card continua aparecendo, mas o flag vem desabilitado (inativo).
    - Exibir informativo "item sem estoque" no card.
    - Bloquear a marcação do flag para estes itens.
- **Botão de Ação em Massa:** 
  - Texto: "Adicionar Seleção à Sacola".
  - Lógica: Adiciona simultaneamente todos os produtos cujas flags estão ativas.

### C. Experiência de Produto sem Estoque
- **Página de Detalhes:** Caso o cliente acesse um produto do artigo que está sem estoque:
  - O botão "Adicionar ao Carrinho" deve ser substituído ou desabilitado.
  - Exibir mensagem clara: "Produto sem estoque no momento".

## 3. Estrutura Técnica

### Banco de Dados (Supabase/Firestore)
- **Tabela `articles`:**
  - `id`: UUID.
  - `title`: String.
  - `content`: Markdown/HTML (Suporte a links internos).
  - `category`: String (ex: "Eventos Corporativos").
  - `product_ids`: Array de referências aos produtos da loja.
  - `featured_image`: URL.
  - `status`: "draft" ou "published".

### UI/UX (Frontend)
- **Componente `StyleArticle.tsx`:** Renderizador do conteúdo.
- **Componente `BundleShop.tsx`:** O rodapé interativo com os minicards e lógica de seleção.
- **Animações (Motion):** Feedback visual suave ao marcar/desmarcar produtos e ao adicionar ao carrinho.

## 4. Gestão Administrativa
- Nova aba no Painel Admin para:
  - Redigir o artigo.
  - Pesquisar e vincular produtos existentes aos artigos.
  - Visualizar métricas de quais artigos estão gerando mais vendas.

## 6. Módulo de Frete Grátis (Fase 2)

### A. Configuração Administrativa
- **Flag Global:** Chave para ativar/desativar a funcionalidade de frete grátis em todo o site.
- **Valor de Gatilho (Threshold):** Campo numérico para definir o valor mínimo de compra necessário.
- **Banner de Comunicado:** Espaço para configurar o texto promocional que aparece na Home (ex: "Frete Grátis para todo o Brasil em compras acima de R$ 200").

### B. Lógica de Cálculo
- **Base de Valor:** O frete grátis deve ser calculado sobre o **valor líquido** da compra (Total dos itens - Cupom de Desconto).
- **Exemplo:** Se o limite é R$ 100,00:
  - Compra de R$ 120,00 - Cupom de R$ 30,00 = R$ 90,00 (Paga frete).
  - Compra de R$ 150,00 - Cupom de R$ 20,00 = R$ 130,00 (Frete Grátis).

### C. Interface do Cliente (UI/UX)
- **Barra de Progresso no Carrinho:** Indicador visual em tempo real mostrando quanto falta para atingir o frete grátis.
  - Mensagem dinâmica: "Faltam apenas R$ XX para você ganhar Frete Grátis!".
- **Etiqueta de Sucesso:** Selo de "Frete Grátis Ativado" quando o valor líquido atingir o gatilho configurado.
- **Banner na Home:** Exibição condicional do banner apenas quando a flag estiver ativa no Admin.

## 7. Cronograma Sugerido (Fase 2 - Atualizado)
1. **Semana 1:** Estrutura de Consultoria de Moda (Blog + Admin).
2. **Semana 2:** Sistema de Shop the Look (Bundle Add to Cart).
3. **Semana 3:** Configurações de Frete Grátis (Admin + Lógica de Carrinho).
4. **Semana 4:** Testes integrados, SEO e Lançamento da Versão 2.0.
